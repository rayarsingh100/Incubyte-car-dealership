const assertDedicatedTestDatabase = ({ requireDatabaseUrlMatch = false, printTarget = true } = {}) => {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required; no fallback to DATABASE_URL is allowed.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(testDatabaseUrl);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new Error("TEST_DATABASE_URL must use PostgreSQL.");
  }

  let databaseName;
  try {
    databaseName = decodeURIComponent(parsedUrl.pathname.slice(1));
  } catch {
    throw new Error("TEST_DATABASE_URL contains an invalid database name.");
  }
  if (!databaseName || !/_test$/i.test(databaseName)) {
    const authorizedExistingDatabase =
      databaseName === "dealership_db" &&
      process.env.ALLOW_EXISTING_DATABASE_TESTS === "dealership_db";

    if (!authorizedExistingDatabase) {
      throw new Error("The dedicated test database name must end in _test.");
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const username = decodeURIComponent(parsedUrl.username);
    if (!["localhost", "127.0.0.1", "::1"].includes(hostname) || parsedUrl.port !== "5432" || username !== "dealership_app") {
      throw new Error("Authorized dealership_db tests require localhost:5432 and the dealership_app database user.");
    }
    if (process.env.DATABASE_URL !== testDatabaseUrl) {
      throw new Error("Authorized dealership_db tests require DATABASE_URL to exactly match TEST_DATABASE_URL.");
    }
  }
  if (process.env.CONFIRM_TEST_DATABASE !== databaseName) {
    throw new Error("Set CONFIRM_TEST_DATABASE to the exact test database name to confirm the target.");
  }
  if (requireDatabaseUrlMatch && process.env.DATABASE_URL !== testDatabaseUrl) {
    throw new Error("The integration process DATABASE_URL must exactly match TEST_DATABASE_URL.");
  }

  if (printTarget) {
    const label = databaseName === "dealership_db" ? "Explicitly authorized PostgreSQL test target" : "Dedicated PostgreSQL test target";
    console.log(`${label}: ${parsedUrl.hostname}${parsedUrl.port ? `:${parsedUrl.port}` : ""}/${databaseName}`);
    console.log("Integration tests do not reset or truncate. Test users and most vehicles/purchases persist; CRUD deletion is limited to its own vehicle.");
  }
  return { databaseName, testDatabaseUrl };
};

module.exports = { assertDedicatedTestDatabase };
