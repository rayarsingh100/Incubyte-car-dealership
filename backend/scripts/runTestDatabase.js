const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const path = require("node:path");
const { assertDedicatedTestDatabase } = require("./testDatabaseGuard");

const mode = process.argv[2];
if (!["migrate", "integration"].includes(mode)) {
  console.error("Usage: node scripts/runTestDatabase.js <migrate|integration>");
  process.exit(2);
}

let target;
try {
  target = assertDedicatedTestDatabase();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL !== target.testDatabaseUrl) {
  console.error("Refusing to run because DATABASE_URL differs from TEST_DATABASE_URL.");
  process.exit(2);
}

const childEnvironment = {
  ...process.env,
  DATABASE_URL: target.testDatabaseUrl,
  JWT_SECRET: process.env.TEST_JWT_SECRET || crypto.randomBytes(48).toString("hex"),
  TEST_DATABASE_TARGET_PRINTED: "1",
};
const args = mode === "migrate"
  ? [require.resolve("prisma"), "migrate", "deploy"]
  : [require.resolve("jest/bin/jest"), "--runInBand", "tests/integration"];
const result = spawnSync(process.execPath, args, {
  cwd: path.resolve(__dirname, ".."),
  env: childEnvironment,
  stdio: "inherit",
});

if (result.error) {
  console.error("Could not start the requested test-database command.");
  process.exit(1);
}
process.exit(result.status ?? 1);
