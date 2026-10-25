require("dotenv").config({ path: require("node:path").resolve(__dirname, "../.env"), quiet: true });

const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const assertLocalDealershipDatabase = () => {
  let databaseUrl;
  try {
    databaseUrl = new URL(process.env.DATABASE_URL || "");
  } catch {
    throw new Error("Configured database target is invalid.");
  }

  const hostname = databaseUrl.hostname.replace(/^\[|\]$/g, "");
  let databaseName;
  try {
    databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
  } catch {
    throw new Error("Configured database target is invalid.");
  }

  if (!["localhost", "127.0.0.1", "::1"].includes(hostname) || databaseName !== "dealership_db") {
    throw new Error("Refusing to continue: target must be local dealership_db.");
  }
};

const findUnusedEmail = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const email = `admin-test-${crypto.randomUUID()}@example.test`;
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!existing) return email;
  }
  throw new Error("Could not generate an unused test email.");
};

const promptHiddenPassword = () => new Promise((resolve, reject) => {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    reject(new Error("A local interactive terminal is required to enter the password safely."));
    return;
  }

  const passwordBytes = [];
  let settled = false;

  const cleanup = () => {
    process.stdin.removeListener("data", onData);
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
    process.removeListener("SIGHUP", onSignal);
    if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
      try {
        process.stdin.setRawMode(false);
      } catch {}
    }
    process.stdin.pause();
    process.stderr.write("\n");
  };

  const finish = (error) => {
    if (settled) return;
    settled = true;
    cleanup();
    if (error) {
      passwordBytes.fill(0);
      reject(error);
    } else {
      const passwordBuffer = Buffer.from(passwordBytes);
      passwordBytes.fill(0);
      resolve(passwordBuffer);
    }
  };

  const onSignal = (signal) => {
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    finish(new Error("Password entry interrupted."));
  };

  const onData = (chunk) => {
    for (const byte of chunk) {
      if (byte === 3) return onSignal("SIGINT");
      if (byte === 4) return finish(new Error("Password input ended."));
      if (byte === 10 || byte === 13) return finish();
      if (byte === 8 || byte === 127) {
        if (passwordBytes.length) {
          const previousLength = passwordBytes.length;
          let start = passwordBytes.length - 1;
          while (start > 0 && (passwordBytes[start] & 0xc0) === 0x80) start -= 1;
          for (let index = start; index < previousLength; index += 1) passwordBytes[index] = 0;
          passwordBytes.length = start;
        }
      } else if (byte >= 32) {
        passwordBytes.push(byte);
      }
    }
  };

  try {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);
    process.on("SIGHUP", onSignal);
    process.stderr.write("Password for the new admin test account (input hidden): ");
  } catch {
    cleanup();
    reject(new Error("Could not open a secure password prompt."));
  }
});

const createAdminTestUser = async () => {
  let passwordBuffer;
  let password;

  try {
    assertLocalDealershipDatabase();
    const email = await findUnusedEmail();
    console.log(`Local dealership_db verified; unused test email selected: ${email}`);

    passwordBuffer = await promptHiddenPassword();
    password = passwordBuffer.toString("utf8");
    if (password.length < 8 || passwordBuffer.length > 72) {
      throw new Error("Password must be at least 8 characters and at most 72 bytes.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    password = undefined;
    passwordBuffer.fill(0);
    passwordBuffer = undefined;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new Error("Selected test email is no longer available.");

    const account = await prisma.user.create({
      data: { name: "Admin Test", email, passwordHash, role: "ADMIN" },
      select: { role: true },
    });
    console.log(`Created ${email} with role ${account.role}.`);
  } finally {
    password = undefined;
    if (passwordBuffer) passwordBuffer.fill(0);
    await prisma.$disconnect();
  }
};

createAdminTestUser().catch((error) => {
  if (error.code === "P2002") {
    console.error("The selected test email is already in use; no existing user was changed.");
  } else if (error.message === "Password must be at least 8 characters and at most 72 bytes.") {
    console.error(error.message);
  } else if (error.message === "A local interactive terminal is required to enter the password safely.") {
    console.error(error.message);
  } else {
    console.error("Admin test account setup failed; no credentials or database details were logged.");
  }
  process.exitCode = 1;
});
