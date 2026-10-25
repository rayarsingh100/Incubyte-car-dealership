process.env.JWT_SECRET = "test-only-jwt-secret-that-is-at-least-32-characters";
process.env.LOGIN_RATE_LIMIT_MAX = "2";
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = "60000";
process.env.TRUST_PROXY_HOPS = "1";

jest.mock("../src/lib/prisma", () => require("./support/prismaMock"));

const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

beforeEach(() => prisma.reset());

test("limits repeated login attempts and returns the standard API error shape", async () => {
  const first = await request(app).post("/api/auth/login").send({ email: "missing@example.com", password: "wrong" });
  const second = await request(app).post("/api/auth/login").send({ email: "missing@example.com", password: "wrong" });
  const limited = await request(app).post("/api/auth/login").send({ email: "missing@example.com", password: "wrong" });

  expect(first.status).toBe(401);
  expect(second.status).toBe(401);
  expect(limited.status).toBe(429);
  expect(limited.body.error.code).toBe("RATE_LIMITED");
  expect(limited.headers).toHaveProperty("ratelimit-limit", "2");
});

test("uses forwarded client addresses as separate login rate-limit keys", async () => {
  expect(app.get("trust proxy")).toBe(1);
  const loginFrom = (address) => request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", address)
    .send({ email: "missing@example.com", password: "wrong" });

  const firstClient = await loginFrom("198.51.100.21");
  const secondClient = await loginFrom("198.51.100.22");
  const secondAttemptFromFirst = await loginFrom("203.0.113.99, 198.51.100.21");
  const thirdAttemptFromFirst = await loginFrom("203.0.113.88, 198.51.100.21");

  expect(firstClient.status).toBe(401);
  expect(secondClient.status).toBe(401);
  expect(secondAttemptFromFirst.status).toBe(401);
  expect(thirdAttemptFromFirst.status).toBe(429);
});
