const { assertDedicatedTestDatabase } = require("../scripts/testDatabaseGuard");

const environmentKeys = ["TEST_DATABASE_URL", "CONFIRM_TEST_DATABASE", "DATABASE_URL", "ALLOW_EXISTING_DATABASE_TESTS"];
let previousEnvironment;

beforeEach(() => {
  previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  for (const key of environmentKeys) delete process.env[key];
});

afterEach(() => {
  for (const key of environmentKeys) {
    if (previousEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = previousEnvironment[key];
  }
});

describe("dedicated test database guard", () => {
  test("requires TEST_DATABASE_URL and never falls back to DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgresql://local/dev_db";
    expect(() => assertDedicatedTestDatabase({ printTarget: false })).toThrow("TEST_DATABASE_URL is required");
  });

  test("rejects dealership_db even when the legacy opt-in is present", () => {
    process.env.TEST_DATABASE_URL = "postgresql://local/dealership_db";
    process.env.CONFIRM_TEST_DATABASE = "dealership_db";
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.ALLOW_EXISTING_DATABASE_TESTS = "dealership_db";
    expect(() => assertDedicatedTestDatabase({ printTarget: false })).toThrow("development databases are not permitted");
  });

  test("does not treat an arbitrary database ending in _test as a project test database", () => {
    process.env.TEST_DATABASE_URL = "postgresql://localhost:5432/customer_test";
    process.env.CONFIRM_TEST_DATABASE = "customer_test";
    expect(() => assertDedicatedTestDatabase({ printTarget: false })).toThrow("dealership_*_test");
  });

  test("requires a local PostgreSQL host and port 5432", () => {
    process.env.TEST_DATABASE_URL = "postgresql://test-host/dealership_integration_test";
    process.env.CONFIRM_TEST_DATABASE = "dealership_integration_test";
    expect(() => assertDedicatedTestDatabase({ printTarget: false })).toThrow("localhost:5432");
  });

  test("requires exact database-name confirmation", () => {
    process.env.TEST_DATABASE_URL = "postgresql://localhost:5432/dealership_integration_test";
    process.env.CONFIRM_TEST_DATABASE = "dealership_other_test";
    expect(() => assertDedicatedTestDatabase({ printTarget: false })).toThrow("CONFIRM_TEST_DATABASE");
  });

  test("accepts a confirmed local project test database", () => {
    process.env.TEST_DATABASE_URL = "postgresql://local-user:local-password@127.0.0.1:5432/dealership_integration_test";
    process.env.CONFIRM_TEST_DATABASE = "dealership_integration_test";
    expect(assertDedicatedTestDatabase({ printTarget: false })).toEqual({
      databaseName: "dealership_integration_test",
      testDatabaseUrl: process.env.TEST_DATABASE_URL,
    });
  });

  test("enforces DATABASE_URL equality in the integration process", () => {
    process.env.TEST_DATABASE_URL = "postgresql://localhost:5432/dealership_integration_test";
    process.env.CONFIRM_TEST_DATABASE = "dealership_integration_test";
    process.env.DATABASE_URL = "postgresql://localhost:5432/dealership_db";
    expect(() => assertDedicatedTestDatabase({ requireDatabaseUrlMatch: true, printTarget: false })).toThrow("must exactly match");
  });
});
