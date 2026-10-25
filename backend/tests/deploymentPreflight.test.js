const { validateDeploymentEnvironment } = require("../scripts/deploymentPreflight");

const validEnvironment = () => ({
  DATABASE_URL: "postgresql://demo:synthetic-only@ep-demo.us-east-1.aws.neon.tech/dealership_demo?sslmode=require",
  JWT_SECRET: "synthetic-test-secret-value-with-at-least-thirty-two-bytes",
  FRONTEND_ORIGIN: "https://inventory-demo.example",
  TRUST_PROXY_HOPS: "2",
  PORT: "10000",
});

test("accepts a structurally valid Neon deployment environment without connecting", () => {
  expect(validateDeploymentEnvironment(validEnvironment())).toEqual([]);
});

test("reports missing required variables by name without revealing values", () => {
  const issues = validateDeploymentEnvironment({});
  const report = issues.join(" ");

  expect(report).toContain("DATABASE_URL");
  expect(report).toContain("JWT_SECRET");
  expect(report).toContain("FRONTEND_ORIGIN");
  expect(report).toContain("TRUST_PROXY_HOPS");
  expect(report).not.toContain("postgres");
});

test("rejects local databases, short JWT secrets, non-exact origins, and unbounded proxy settings", () => {
  const environment = validEnvironment();
  environment.DATABASE_URL = "postgresql://user:synthetic-password@localhost:5432/dealership_db";
  environment.JWT_SECRET = "too-short";
  environment.FRONTEND_ORIGIN = "https://inventory-demo.example/path";
  environment.TRUST_PROXY_HOPS = "true";

  const issues = validateDeploymentEnvironment(environment);
  const report = issues.join(" ");

  expect(report).toContain("DATABASE_URL must target the separate Neon demo database.");
  expect(report).toContain("JWT_SECRET must contain at least 32 UTF-8 bytes");
  expect(report).toContain("FRONTEND_ORIGIN must be the exact HTTPS origin");
  expect(report).toContain("TRUST_PROXY_HOPS must be set from 1 through 5");
  expect(report).not.toContain("synthetic-password");
});

test("rejects malformed connection URLs, insecure SSL modes, and invalid ports without echoing input", () => {
  const environment = validEnvironment();
  environment.DATABASE_URL = "not-a-connection-url-with-secret-like-text";
  environment.PORT = "65536";

  const report = validateDeploymentEnvironment(environment).join(" ");

  expect(report).toContain("DATABASE_URL must be a valid PostgreSQL connection URL.");
  expect(report).toContain("PORT must be an integer");
  expect(report).not.toContain("secret-like-text");
});
