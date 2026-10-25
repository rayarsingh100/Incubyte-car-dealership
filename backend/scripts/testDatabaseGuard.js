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
  if (!/^dealership_.+_test$/i.test(databaseName)) {
    throw new Error("TEST_DATABASE_URL must name a dedicated dealership_*_test database; development databases are not permitted.");
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const port = parsedUrl.port || "5432";
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname) || port !== "5432") {
    throw new Error("TEST_DATABASE_URL must target local PostgreSQL on localhost:5432.");
  }
  if (process.env.CONFIRM_TEST_DATABASE !== databaseName) {
    throw new Error("Set CONFIRM_TEST_DATABASE to the exact test database name to confirm the target.");
  }
  if (requireDatabaseUrlMatch && process.env.DATABASE_URL !== testDatabaseUrl) {
    throw new Error("The integration process DATABASE_URL must exactly match TEST_DATABASE_URL.");
  }

  if (printTarget) {
    console.log(`Dedicated PostgreSQL test target: ${parsedUrl.hostname}${parsedUrl.port ? `:${parsedUrl.port}` : ""}/${databaseName}`);
    console.log("Integration tests do not reset or truncate. They remove only purchases, users, and vehicles created by the current run.");
  }
  return { databaseName, testDatabaseUrl };
};

module.exports = { assertDedicatedTestDatabase };
