process.env.JWT_SECRET = "test-only-jwt-secret-that-is-at-least-32-characters";
process.env.LOGIN_RATE_LIMIT_MAX = "2";
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = "60000";

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
