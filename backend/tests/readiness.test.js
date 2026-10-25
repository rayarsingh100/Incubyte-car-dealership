jest.mock("../src/lib/prisma", () => require("./support/prismaMock"));

const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

test("GET /api/ready performs a minimal database readiness query", async () => {
  prisma.$queryRaw.mockResolvedValueOnce([{ ready: 1 }]);

  const response = await request(app).get("/api/ready");

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: "ready" });
  expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
});

test("GET /api/ready returns a sanitized unavailable response when PostgreSQL is unreachable", async () => {
  prisma.$queryRaw.mockRejectedValueOnce(new Error("sensitive connection details"));

  const response = await request(app).get("/api/ready");

  expect(response.status).toBe(503);
  expect(response.body).toEqual({ status: "not_ready" });
  expect(JSON.stringify(response.body)).not.toContain("sensitive connection details");
});
