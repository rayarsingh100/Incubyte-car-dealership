const { loadSmokeConfiguration, runDeploymentSmokeTest } = require("../scripts/deploymentSmokeTest");

const baseEnvironment = () => ({ SMOKE_API_BASE_URL: "https://api.example.test/api" });
const jsonResponse = (status, payload, headerValues = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn(async () => payload),
  headers: { get: (name) => headerValues[name.toLowerCase()] || null },
});

function createMockFetch() {
  const calls = [];
  const fetchImpl = jest.fn(async (rawUrl, options) => {
    const url = new URL(rawUrl);
    calls.push({ url, options });

    if (url.pathname === "/api/health") return jsonResponse(200, { status: "ok" });
    if (url.pathname === "/api/ready") return jsonResponse(200, { status: "ready" });
    if (url.pathname === "/api/vehicles" && options.method === "OPTIONS") {
      return {
        ok: true,
        status: 204,
        headers: {
          get: (name) => ({
            "access-control-allow-origin": "https://inventory-demo.example",
            "access-control-allow-methods": "GET, POST, PATCH, DELETE",
            "access-control-allow-headers": "Authorization, Content-Type",
          })[name.toLowerCase()] || null,
        },
      };
    }
    if (url.pathname === "/api/vehicles") return jsonResponse(200, { vehicles: [], pagination: { page: 1, limit: 1, total: 0, pages: 0 } });
    if (url.pathname === "/api/auth/login") return jsonResponse(200, { token: "synthetic-token", user: { id: "synthetic-user", role: "USER" } });
    if (url.pathname === "/api/purchases") return jsonResponse(200, { purchases: [], pagination: { page: 1, limit: 1, total: 0, pages: 0 } });
    throw new Error("Unexpected endpoint in test mock.");
  });
  return { fetchImpl, calls };
}

test("requires a public HTTPS API URL and paired smoke credentials", () => {
  expect(() => loadSmokeConfiguration({ SMOKE_API_BASE_URL: "http://localhost:3000/api" })).toThrow("HTTPS");
  expect(() => loadSmokeConfiguration({ ...baseEnvironment(), SMOKE_TEST_EMAIL: "demo@example.test" })).toThrow("Set both");
});

test("runs health, readiness, and inventory smoke checks without credentials or writes", async () => {
  const { fetchImpl, calls } = createMockFetch();
  const log = jest.fn();

  const result = await runDeploymentSmokeTest({ environment: baseEnvironment(), fetchImpl, log });

  expect(result).toEqual({ authenticated: false });
  expect(calls.map(({ options }) => options.method)).toEqual(["GET", "GET", "GET"]);
  expect(calls.every(({ options }) => options.method === "GET")).toBe(true);
  expect(log).toHaveBeenCalledWith(expect.stringContaining("SKIP authentication"));
});

test("uses only login POST plus read-only requests and never logs credentials or JWTs", async () => {
  const environment = {
    ...baseEnvironment(),
    SMOKE_TEST_EMAIL: "demo@example.test",
    SMOKE_TEST_PASSWORD: "synthetic-private-password",
    SMOKE_FRONTEND_ORIGIN: "https://inventory-demo.example",
  };
  const { fetchImpl, calls } = createMockFetch();
  const log = jest.fn();

  const result = await runDeploymentSmokeTest({ environment, fetchImpl, log });

  expect(result).toEqual({ authenticated: true });
  expect(calls.map(({ options }) => options.method)).toEqual(["GET", "GET", "GET", "OPTIONS", "POST", "GET"]);
  expect(calls.at(-2).options.body).toContain(environment.SMOKE_TEST_PASSWORD);
  expect(calls.at(-1).options.headers.Authorization).toBe("Bearer synthetic-token");
  expect(log.mock.calls.flat().join(" ")).not.toContain(environment.SMOKE_TEST_PASSWORD);
  expect(log.mock.calls.flat().join(" ")).not.toContain("synthetic-token");
  expect(log.mock.calls.flat().join(" ")).not.toContain(environment.SMOKE_TEST_EMAIL);
});
