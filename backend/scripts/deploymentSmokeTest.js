const VALID_ROLES = new Set(["USER", "ADMIN"]);
const REQUEST_TIMEOUT_MS = 10000;

function loadSmokeConfiguration(environment) {
  const rawBaseUrl = environment.SMOKE_API_BASE_URL;
  if (!rawBaseUrl) throw new Error("SMOKE_API_BASE_URL is required.");

  let apiBaseUrl;
  try {
    const parsedUrl = new URL(rawBaseUrl);
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.search ||
      parsedUrl.hash ||
      parsedUrl.pathname.replace(/\/+$/, "") !== "/api"
    ) {
      throw new Error();
    }
    apiBaseUrl = `${parsedUrl.origin}/api`;
  } catch {
    throw new Error("SMOKE_API_BASE_URL must be an HTTPS API base URL ending in /api.");
  }

  const email = environment.SMOKE_TEST_EMAIL;
  const password = environment.SMOKE_TEST_PASSWORD;
  if (Boolean(email) !== Boolean(password)) {
    throw new Error("Set both SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD, or leave both unset.");
  }

  let frontendOrigin;
  if (environment.SMOKE_FRONTEND_ORIGIN) {
    try {
      const parsedOrigin = new URL(environment.SMOKE_FRONTEND_ORIGIN);
      if (parsedOrigin.protocol !== "https:" || parsedOrigin.origin !== environment.SMOKE_FRONTEND_ORIGIN) throw new Error();
      frontendOrigin = parsedOrigin.origin;
    } catch {
      throw new Error("SMOKE_FRONTEND_ORIGIN must be the exact HTTPS frontend origin.");
    }
  }

  return { apiBaseUrl, email, password, frontendOrigin };
}

function isPagination(value) {
  return value && ["page", "limit", "total", "pages"].every((key) => Number.isInteger(value[key]));
}

async function requestJson(fetchImpl, apiBaseUrl, path, { method = "GET", token, body, headers = {} } = {}) {
  const requestHeaders = { Accept: "application/json", ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetchImpl(`${apiBaseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error(`${method} ${path} could not reach the configured API.`);
  }

  if (!response.ok) throw new Error(`${method} ${path} returned HTTP ${response.status}.`);
  if (response.status === 204) return { response, payload: null };

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${method} ${path} returned invalid JSON.`);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`${method} ${path} returned an unexpected response.`);
  }
  return { response, payload };
}

async function runDeploymentSmokeTest({ environment = process.env, fetchImpl = fetch, log = console.log } = {}) {
  const config = loadSmokeConfiguration(environment);
  const check = async (path, expectedStatus = 200, options = {}) => {
    const result = await requestJson(fetchImpl, config.apiBaseUrl, path, options);
    if (result.response.status !== expectedStatus) throw new Error(`${options.method || "GET"} ${path} returned an unexpected status.`);
    log(`PASS ${options.method || "GET"} ${path}`);
    return result;
  };

  const health = await check("/health");
  if (health.payload.status !== "ok") throw new Error("GET /health did not return the liveness status.");

  const readiness = await check("/ready");
  if (readiness.payload.status !== "ready") throw new Error("GET /ready did not report database readiness.");

  const inventory = await check("/vehicles?page=1&limit=1");
  if (!Array.isArray(inventory.payload.vehicles) || !isPagination(inventory.payload.pagination)) {
    throw new Error("GET /vehicles returned an unexpected inventory response.");
  }

  if (config.frontendOrigin) {
    const preflight = await check("/vehicles", 204, {
      method: "OPTIONS",
      headers: {
        Origin: config.frontendOrigin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });
    const allowOrigin = preflight.response.headers.get("access-control-allow-origin");
    const allowMethods = (preflight.response.headers.get("access-control-allow-methods") || "").split(",").map((item) => item.trim());
    const allowHeaders = (preflight.response.headers.get("access-control-allow-headers") || "").toLowerCase().split(",").map((item) => item.trim());
    if (
      allowOrigin !== config.frontendOrigin ||
      !allowMethods.includes("GET") ||
      !allowHeaders.includes("authorization") ||
      !allowHeaders.includes("content-type") ||
      preflight.response.headers.get("access-control-allow-credentials")
    ) {
      throw new Error("CORS preflight did not match the configured origin, method, and header policy.");
    }
  }

  if (!config.email && !config.password) {
    log("SKIP authentication checks; demo credentials were not provided.");
    return { authenticated: false };
  }

  const login = await check("/auth/login", 200, {
    method: "POST",
    body: { email: config.email, password: config.password },
  });
  const token = login.payload.token;
  const user = login.payload.user;
  if (typeof token !== "string" || token.length === 0 || !user || typeof user.id !== "string" || !VALID_ROLES.has(user.role)) {
    throw new Error("POST /auth/login returned an unexpected authenticated session.");
  }

  const history = await check("/purchases?page=1&limit=1", 200, { token });
  if (!Array.isArray(history.payload.purchases) || !isPagination(history.payload.pagination)) {
    throw new Error("GET /purchases returned an unexpected history response.");
  }

  log("PASS authenticated read-only checks (token and credentials were not logged).");
  return { authenticated: true };
}

if (require.main === module) {
  runDeploymentSmokeTest().catch((error) => {
    console.error(`Deployment smoke test failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { loadSmokeConfiguration, runDeploymentSmokeTest };
