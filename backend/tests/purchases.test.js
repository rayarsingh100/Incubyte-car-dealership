process.env.JWT_SECRET = "test-only-jwt-secret-that-is-at-least-32-characters";
process.env.LOGIN_RATE_LIMIT_MAX = "100";

jest.mock("../src/lib/prisma", () => require("./support/prismaMock"));

const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

const userData = { name: "History User", email: "history-user@example.com", password: "SecurePass123!" };
const otherUserData = { name: "Other User", email: "other-user@example.com", password: "SecurePass123!" };
const vehicleData = { make: "Toyota", model: "Corolla", category: "Sedan", price: 24999.95, quantity: 5 };

const registerAndLogin = async (user) => {
  await request(app).post("/api/auth/register").send(user);
  const response = await request(app).post("/api/auth/login").send({ email: user.email, password: user.password });
  return response.body;
};

const createVehicle = async (token) => {
  const response = await request(app).post("/api/vehicles").set("Authorization", `Bearer ${token}`).send(vehicleData);
  return response.body.vehicle;
};

beforeEach(() => {
  prisma.reset();
});

describe("GET /api/purchases", () => {
  test("requires a valid, unexpired bearer token", async () => {
    const expiredToken = jwt.sign({}, process.env.JWT_SECRET, { subject: "expired-user", expiresIn: -1 });
    for (const token of [null, "invalid", expiredToken]) {
      const response = await request(app)
        .get("/api/purchases")
        .set(token ? "Authorization" : "X-Test-Unauthenticated", token ? `Bearer ${token}` : "true");
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    }
  });

  test("returns an empty paginated history for an authenticated customer", async () => {
    const session = await registerAndLogin(userData);
    const response = await request(app).get("/api/purchases").set("Authorization", `Bearer ${session.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ purchases: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
  });

  test("returns only the authenticated user's purchases with safe vehicle details and stable newest-first ordering", async () => {
    const [session, otherSession] = await Promise.all([registerAndLogin(userData), registerAndLogin(otherUserData)]);
    await registerAndLogin({ name: "History Admin", email: "history-admin@example.com", password: "SecurePass123!" });
    prisma.setRole("history-admin@example.com", "ADMIN");
    const adminSession = await request(app).post("/api/auth/login").send({ email: "history-admin@example.com", password: "SecurePass123!" });
    const firstVehicle = await createVehicle(adminSession.body.token);
    const secondVehicle = await createVehicle(adminSession.body.token);

    await request(app).post(`/api/vehicles/${firstVehicle.id}/purchases`).set("Authorization", `Bearer ${session.token}`).send({ quantity: 2 });
    await request(app).post(`/api/vehicles/${secondVehicle.id}/purchases`).set("Authorization", `Bearer ${otherSession.token}`).send({ quantity: 1 });

    const response = await request(app)
      .get(`/api/purchases?userId=${encodeURIComponent(otherSession.user.id)}`)
      .set("Authorization", `Bearer ${session.token}`);
    expect(response.status).toBe(200);
    expect(response.body.purchases).toHaveLength(1);
    expect(response.body.purchases[0]).toMatchObject({
      vehicleId: firstVehicle.id,
      quantity: 2,
      unitPrice: "24999.95",
      totalAmount: "49999.90",
      vehicle: { id: firstVehicle.id, make: "Toyota", model: "Corolla", category: "Sedan" },
    });
    expect(response.body.purchases[0]).toHaveProperty("createdAt");
    expect(response.body.purchases[0]).not.toHaveProperty("userId");
    expect(response.body.purchases[0]).not.toHaveProperty("user");
    expect(response.body.purchases[0]).not.toHaveProperty("vehicle.quantity");
    expect(response.body.purchases[0]).not.toHaveProperty("vehicle.price");
    expect(response.body.purchases[0]).not.toHaveProperty("passwordHash");
    expect(prisma.purchase.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: session.user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }));
  });

  test("validates pagination parameters", async () => {
    const session = await registerAndLogin(userData);
    const response = await request(app).get("/api/purchases?page=0").set("Authorization", `Bearer ${session.token}`);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_QUERY");
  });
});
