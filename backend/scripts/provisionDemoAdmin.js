const ACCEPTED_SSL_MODES = new Set(["require", "verify-ca", "verify-full"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateDemoTarget(environment) {
  const rawUrl = environment.DEMO_DATABASE_URL;
  if (!rawUrl) throw new Error("DEMO_DATABASE_URL is required; no DATABASE_URL fallback is allowed.");

  let parsedUrl;
  let databaseName;
  try {
    parsedUrl = new URL(rawUrl);
    databaseName = decodeURIComponent(parsedUrl.pathname.slice(1).split("/")[0]);
  } catch {
    throw new Error("DEMO_DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol) || !databaseName) {
    throw new Error("DEMO_DATABASE_URL must include a PostgreSQL database name.");
  }
  if (!parsedUrl.hostname.toLowerCase().endsWith(".neon.tech")) {
    throw new Error("DEMO_DATABASE_URL must target the separately provisioned Neon demo database.");
  }
  if (!ACCEPTED_SSL_MODES.has(parsedUrl.searchParams.get("sslmode"))) {
    throw new Error("DEMO_DATABASE_URL must require TLS.");
  }
  if (environment.CONFIRM_DEMO_HOST !== parsedUrl.hostname) {
    throw new Error("CONFIRM_DEMO_HOST must exactly match the Neon hostname verified in the dashboard.");
  }
  if (environment.CONFIRM_DEMO_DATABASE !== databaseName || databaseName.toLowerCase() === "dealership_db") {
    throw new Error("CONFIRM_DEMO_DATABASE must exactly match the dedicated demo database name.");
  }
  if (environment.DATABASE_URL && environment.DATABASE_URL !== rawUrl) {
    throw new Error("DATABASE_URL conflicts with DEMO_DATABASE_URL; refusing to continue.");
  }

  return { url: rawUrl, hostname: parsedUrl.hostname, databaseName };
}

function validateAdminDetails({ name, email, password, passwordConfirmation }) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    throw new Error("Admin name must contain 1 to 100 characters.");
  }
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    throw new Error("A valid admin email is required.");
  }
  if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Admin password must be at least 8 characters and no more than 72 UTF-8 bytes.");
  }
  if (password !== passwordConfirmation) throw new Error("The password entries did not match.");
  return { name: name.trim(), email: email.trim().toLowerCase(), password };
}

function askLine(prompt) {
  const readline = require("node:readline");
  const interfaceHandle = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => interfaceHandle.question(prompt, (answer) => {
    interfaceHandle.close();
    resolve(answer);
  }));
}

function askHidden(prompt) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    return Promise.reject(new Error("A private interactive terminal is required for admin credentials."));
  }

  const previousRawMode = Boolean(input.isRaw);
  const previousEncoding = input.readableEncoding;
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      input.removeListener("data", onData);
      input.setRawMode(previousRawMode);
      input.pause();
      if (previousEncoding) input.setEncoding(previousEncoding);
    };
    const onData = (chunk) => {
      const key = String(chunk);
      if (key === "\u0003") {
        cleanup();
        process.stdout.write("\n");
        reject(new Error("Admin provisioning was cancelled."));
      } else if (key === "\r" || key === "\n") {
        cleanup();
        process.stdout.write("\n");
        resolve(value);
      } else if (key === "\u007f" || key === "\b") {
        value = value.slice(0, -1);
      } else if (!key.startsWith("\u001b")) {
        value += key;
      }
    };

    process.stdout.write(prompt);
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

async function main() {
  const target = validateDemoTarget(process.env);
  console.log(`Verified demo target: ${target.hostname}/${target.databaseName}`);
  const confirmation = await askLine(`Type ${target.databaseName} to confirm creating a new ADMIN account in this database: `);
  if (confirmation !== target.databaseName) throw new Error("Database confirmation did not match; no account was created.");

  const name = await askLine("Admin name: ");
  const email = await askLine("Admin email: ");
  const password = await askHidden("Admin password (input hidden): ");
  const passwordConfirmation = await askHidden("Confirm admin password (input hidden): ");
  const details = validateAdminDetails({ name, email, password, passwordConfirmation });

  // Prisma reads DATABASE_URL at client construction; this process-local assignment uses only the explicit guarded demo target.
  process.env.DATABASE_URL = target.url;
  const bcrypt = require("bcrypt");
  const prisma = require("../src/lib/prisma");

  try {
    const passwordHash = await bcrypt.hash(details.password, 10);
    await prisma.user.create({
      data: { name: details.name, email: details.email, passwordHash, role: "ADMIN" },
      select: { id: true },
    });
    console.log("Demo ADMIN account created. Credentials were not logged.");
  } catch (error) {
    if (error.code === "P2002") {
      console.error("Admin was not created because an account already exists for that email; existing accounts are never promoted.");
      process.exitCode = 1;
    } else {
      console.error("Admin provisioning failed. Detailed errors were omitted to avoid exposing connection information.");
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Admin provisioning stopped: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { validateAdminDetails, validateDemoTarget };
