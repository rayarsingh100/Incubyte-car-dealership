const MIN_JWT_SECRET_BYTES = 32;
const ACCEPTED_SSL_MODES = new Set(["require", "verify-ca", "verify-full"]);

function validateDeploymentEnvironment(environment) {
  const issues = [];

  const databaseUrl = environment.DATABASE_URL;
  if (!databaseUrl) {
    issues.push("DATABASE_URL is required.");
  } else {
    try {
      const parsedUrl = new URL(databaseUrl);
      const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1).split("/")[0]);
      if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol) || !databaseName) {
        issues.push("DATABASE_URL must be a valid PostgreSQL connection URL with a database name.");
      } else if (!parsedUrl.hostname.toLowerCase().endsWith(".neon.tech")) {
        issues.push("DATABASE_URL must target the separate Neon demo database.");
      }
      if (!ACCEPTED_SSL_MODES.has(parsedUrl.searchParams.get("sslmode"))) {
        issues.push("DATABASE_URL must require TLS with sslmode=require, verify-ca, or verify-full.");
      }
    } catch {
      issues.push("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }
  }

  const jwtSecret = environment.JWT_SECRET;
  if (typeof jwtSecret !== "string" || Buffer.byteLength(jwtSecret, "utf8") < MIN_JWT_SECRET_BYTES) {
    issues.push("JWT_SECRET must contain at least 32 UTF-8 bytes; generate it randomly and keep it private.");
  }

  const frontendOrigin = environment.FRONTEND_ORIGIN;
  if (!frontendOrigin) {
    issues.push("FRONTEND_ORIGIN is required for the separate hosted frontend.");
  } else {
    try {
      const parsedOrigin = new URL(frontendOrigin);
      if (parsedOrigin.protocol !== "https:" || parsedOrigin.origin !== frontendOrigin) {
        issues.push("FRONTEND_ORIGIN must be the exact HTTPS origin, without a path or trailing slash.");
      }
    } catch {
      issues.push("FRONTEND_ORIGIN must be a valid exact HTTPS origin.");
    }
  }

  const trustProxyHops = environment.TRUST_PROXY_HOPS;
  if (!/^[1-5]$/.test(trustProxyHops || "")) {
    issues.push("TRUST_PROXY_HOPS must be set from 1 through 5 after verifying the hosting proxy chain.");
  }

  if (environment.PORT !== undefined) {
    const port = Number(environment.PORT);
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
      issues.push("PORT must be an integer from 1 through 65535 when provided.");
    }
  }

  return issues;
}

function main() {
  const issues = validateDeploymentEnvironment(process.env);
  if (issues.length > 0) {
    console.error(`Deployment preflight failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    process.exitCode = 1;
    return;
  }
  console.log("Deployment preflight passed. Required settings are present and structurally valid; no connection was made.");
}

if (require.main === module) main();

module.exports = { validateDeploymentEnvironment };
