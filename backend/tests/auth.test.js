const request = require("supertest");

process.env.JWT_SECRET = "test-only-jwt-secret-that-is-at-least-32-characters";

jest.mock("../src/lib/prisma", () => require("./support/prismaMock"));

const bcrypt = require("bcrypt");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

describe("POST /api/auth/register", () => {
  test("registers a new user successfully", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        password: "SecurePass123!",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.name).toBe("Test User");
    expect(response.body.user).not.toHaveProperty("password");
    expect(response.body.user).not.toHaveProperty("passwordHash");
  });

  test("rejects login passwords exceeding bcrypt's 72-byte UTF-8 limit", async () => {
    prisma.reset();
    const password = "😀".repeat(18);
    expect(Buffer.byteLength(password, "utf8")).toBe(72);
    expect(password.length).toBeLessThan(72);

    const email = `utf8-${Date.now()}@example.com`;
    const registered = await request(app)
      .post("/api/auth/register")
      .send({ name: "UTF-8 Test User", email, password });
    expect(registered.statusCode).toBe(201);

    const compareSpy = jest.spyOn(bcrypt, "compare");
    try {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email, password: `${password}x` });

      expect({
        status: response.statusCode,
        code: response.body.error?.code,
        bcryptCompareCalls: compareSpy.mock.calls.length,
      }).toEqual({ status: 400, code: "INVALID_INPUT", bcryptCompareCalls: 0 });
    } finally {
      compareSpy.mockRestore();
    }
  });
});
