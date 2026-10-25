const { validateAdminDetails, validateDemoTarget } = require("../scripts/provisionDemoAdmin");

const validEnvironment = () => ({
  DEMO_DATABASE_URL: "postgresql://admin:synthetic-only@ep-demo.us-east-1.aws.neon.tech/dealership_demo?sslmode=require",
  CONFIRM_DEMO_HOST: "ep-demo.us-east-1.aws.neon.tech",
  CONFIRM_DEMO_DATABASE: "dealership_demo",
});

test("requires an explicitly confirmed Neon target and never falls back to DATABASE_URL", () => {
  expect(validateDemoTarget(validEnvironment())).toMatchObject({
    hostname: "ep-demo.us-east-1.aws.neon.tech",
    databaseName: "dealership_demo",
  });
  expect(() => validateDemoTarget({ DATABASE_URL: "postgresql://localhost/dealership_db" })).toThrow("no DATABASE_URL fallback");
});

test("rejects local databases, mismatched host/database confirmations, and conflicting runtime URLs", () => {
  const localDatabase = {
    DEMO_DATABASE_URL: "postgresql://user:synthetic-pass@localhost:5432/dealership_db?sslmode=require",
    CONFIRM_DEMO_HOST: "localhost",
    CONFIRM_DEMO_DATABASE: "dealership_db",
  };
  expect(() => validateDemoTarget(localDatabase)).toThrow("Neon demo database");

  const wrongHost = validEnvironment();
  wrongHost.CONFIRM_DEMO_HOST = "another.neon.tech";
  expect(() => validateDemoTarget(wrongHost)).toThrow("CONFIRM_DEMO_HOST");

  const wrongDatabase = validEnvironment();
  wrongDatabase.CONFIRM_DEMO_DATABASE = "other_database";
  expect(() => validateDemoTarget(wrongDatabase)).toThrow("CONFIRM_DEMO_DATABASE");

  const conflictingUrl = validEnvironment();
  conflictingUrl.DATABASE_URL = "postgresql://localhost/dealership_db";
  expect(() => validateDemoTarget(conflictingUrl)).toThrow("conflicts with DEMO_DATABASE_URL");
});

test("validates new admin credentials without permitting role promotion", () => {
  expect(validateAdminDetails({
    name: " Demo Admin ",
    email: "ADMIN@EXAMPLE.TEST",
    password: "a-secure-synthetic-password",
    passwordConfirmation: "a-secure-synthetic-password",
  })).toEqual({ name: "Demo Admin", email: "admin@example.test", password: "a-secure-synthetic-password" });

  expect(() => validateAdminDetails({ name: "Admin", email: "admin@example.test", password: "short", passwordConfirmation: "short" }))
    .toThrow("at least 8 characters");
  expect(() => validateAdminDetails({ name: "Admin", email: "admin@example.test", password: "valid-password", passwordConfirmation: "different-password" }))
    .toThrow("did not match");
  expect(() => validateAdminDetails({ name: "Admin", email: "bad-email", password: "valid-password", passwordConfirmation: "valid-password" }))
    .toThrow("valid admin email");
});
