const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);
const ALLOWED_HEADERS = new Set(["authorization", "content-type"]);

function isValidConfiguredOrigin(origin) {
  if (!origin) return false;
  try {
    const parsedOrigin = new URL(origin);
    return (parsedOrigin.protocol === "http:" || parsedOrigin.protocol === "https:") && parsedOrigin.origin === origin;
  } catch {
    return false;
  }
}

function cors(req, res, next) {
  const origin = req.get("Origin");
  const allowedOrigin = process.env.FRONTEND_ORIGIN;
  const isAllowedOrigin = Boolean(origin && origin === allowedOrigin && isValidConfiguredOrigin(allowedOrigin));

  if (origin) res.vary("Origin");

  if (isAllowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  }

  if (req.method !== "OPTIONS") return next();

  res.vary("Access-Control-Request-Method");
  res.vary("Access-Control-Request-Headers");

  if (!isAllowedOrigin) {
    return res.status(403).json({
      error: { code: "CORS_ORIGIN_DENIED", message: "Origin is not allowed." },
    });
  }

  const requestedMethod = req.get("Access-Control-Request-Method");
  const requestedHeaders = (req.get("Access-Control-Request-Headers") || "")
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);

  if (!ALLOWED_METHODS.has(requestedMethod) || requestedHeaders.some((header) => !ALLOWED_HEADERS.has(header))) {
    return res.status(403).json({
      error: { code: "CORS_PREFLIGHT_DENIED", message: "Requested method or headers are not allowed." },
    });
  }

  res.setHeader("Access-Control-Allow-Methods", [...ALLOWED_METHODS].join(", "));
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  return res.status(204).end();
}

module.exports = cors;
