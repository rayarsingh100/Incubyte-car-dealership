const { assertDedicatedTestDatabase } = require("../../scripts/testDatabaseGuard");

assertDedicatedTestDatabase({
  requireDatabaseUrlMatch: true,
  printTarget: process.env.TEST_DATABASE_TARGET_PRINTED !== "1",
});

const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const request = require("supertest");
const app = require("../../src/app");
const prisma = require("../../src/lib/prisma");

jest.setTimeout(30000);

const suffix = crypto.randomUUID();
const regularUser = {
  name: "Integration User",
  email: `integration-user-${suffix}@example.test`,
  password: "IntegrationPass123!",
};
const adminUser = {
  name: "Integration Admin",
  email: `integration-admin-${suffix}@example.test`,
  password: "IntegrationPass123!",
  role: "ADMIN",
};
let regularToken;
let adminToken;
let protectedVehicleId;

const vehiclePayload = (quantity = 5) => ({
  make: "Integration Motors",
  model: `Model-${suffix.slice(0, 8)}`,
  category: "Test Vehicle",
  price: 12345.67,
  quantity,
});

const register = async (account) => request(app).post("/api/auth/register").send(account);
const login = async (account) => request(app).post("/api/auth/login").send({ email: account.email, password: account.password });
const createVehicle = async (quantity = 5) => {
  const response = await request(app)
    .post("/api/vehicles")
    .set("Authorization", `Bearer ${adminToken}`)
    .send(vehiclePayload(quantity));
  expect(response.status).toBe(201);
  return response.body.vehicle;
};

beforeAll(async () => {
  const registeredRegular = await register(regularUser);
  expect(registeredRegular.status).toBe(201);

  const regularRecord = await prisma.user.findUnique({ where: { email: regularUser.email } });
  expect(regularRecord.passwordHash).not.toBe(regularUser.password);
  expect(await bcrypt.compare(regularUser.password, regularRecord.passwordHash)).toBe(true);

  const registeredAdmin = await register(adminUser);
  expect(registeredAdmin.status).toBe(201);
  expect(registeredAdmin.body.user.role).toBe("USER");
  await prisma.user.update({ where: { email: adminUser.email }, data: { role: "ADMIN" } });

  const [regularLogin, adminLogin] = await Promise.all([login(regularUser), login(adminUser)]);
  expect(regularLogin.status).toBe(200);
  expect(adminLogin.status).toBe(200);
  expect(regularLogin.body.user).not.toHaveProperty("passwordHash");
  regularToken = regularLogin.body.token;
  adminToken = adminLogin.body.token;
  protectedVehicleId = (await createVehicle(3)).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("dedicated PostgreSQL API integration", () => {
  test("rejects duplicate registrations and invalid registration input", async () => {
    expect((await register(regularUser)).status).toBe(409);
    expect((await register({ name: "", email: "invalid", password: "short" })).status).toBe(400);
  });

  test("issues and verifies JWTs on protected routes", async () => {
    expect((await request(app).post(`/api/vehicles/${protectedVehicleId}/purchases`).send({ quantity: 1 })).status).toBe(401);
    expect((await request(app).post(`/api/vehicles/${protectedVehicleId}/purchases`).set("Authorization", "Bearer invalid").send({ quantity: 1 })).status).toBe(401);
    const purchase = await request(app)
      .post(`/api/vehicles/${protectedVehicleId}/purchases`)
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ quantity: 1 });
    expect(purchase.status).toBe(201);
  });

  test("enforces administrator permissions using the stored role", async () => {
    expect((await request(app).post("/api/vehicles").set("Authorization", `Bearer ${regularToken}`).send(vehiclePayload())).status).toBe(403);
    expect((await request(app).patch(`/api/vehicles/${protectedVehicleId}`).set("Authorization", `Bearer ${regularToken}`).send({ price: 1 })).status).toBe(403);
    expect((await request(app).post(`/api/vehicles/${protectedVehicleId}/restock`).set("Authorization", `Bearer ${regularToken}`).send({ quantity: 1 })).status).toBe(403);
  });

  test("performs vehicle create, detail, update, validation, not-found, and delete operations", async () => {
    const created = await createVehicle(2);
    const detail = await request(app).get(`/api/vehicles/${created.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.vehicle.id).toBe(created.id);

    const updated = await request(app)
      .patch(`/api/vehicles/${created.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 12346.78 });
    expect(updated.status).toBe(200);
    expect(updated.body.vehicle.price).toBe("12346.78");

    expect((await request(app).post("/api/vehicles").set("Authorization", `Bearer ${adminToken}`).send({ ...vehiclePayload(), quantity: -1 })).status).toBe(400);
    expect((await request(app).get(`/api/vehicles/${crypto.randomUUID()}`)).status).toBe(404);
    expect((await request(app).get("/api/vehicles/not-a-uuid")).status).toBe(400);

    const deleted = await request(app).delete(`/api/vehicles/${created.id}`).set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
    expect((await request(app).get(`/api/vehicles/${created.id}`)).status).toBe(404);
  });

  test("restocks stock atomically for admins only", async () => {
    const vehicle = await createVehicle(2);
    const restocked = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 4 });
    expect(restocked.status).toBe(200);
    expect(restocked.body.vehicle.quantity).toBe(6);
    expect((await request(app).post(`/api/vehicles/${vehicle.id}/restock`).set("Authorization", `Bearer ${adminToken}`).send({ quantity: 0 })).status).toBe(400);
  });

  test("records purchases, decrements inventory, and preserves stock on insufficient quantity", async () => {
    const vehicle = await createVehicle(2);
    const first = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchases`)
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ quantity: 1 });
    expect(first.status).toBe(201);
    expect(first.body.purchase.vehicleId).toBe(vehicle.id);

    const insufficient = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchases`)
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ quantity: 2 });
    expect(insufficient.status).toBe(409);
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } })).quantity).toBe(1);
    expect(await prisma.purchase.count({ where: { vehicleId: vehicle.id } })).toBe(1);
  });

  test("rolls back a database stock update when the transaction fails", async () => {
    const vehicle = await createVehicle(3);
    await expect(prisma.$transaction(async (transaction) => {
      const result = await transaction.vehicle.updateMany({
        where: { id: vehicle.id, quantity: { gte: 1 } },
        data: { quantity: { decrement: 1 } },
      });
      expect(result.count).toBe(1);
      throw new Error("intentional transaction rollback");
    })).rejects.toThrow("intentional transaction rollback");

    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } })).quantity).toBe(3);
  });

  test("prevents overselling under concurrent database-backed purchases", async () => {
    const vehicle = await createVehicle(1);
    const responses = await Promise.all(Array.from({ length: 5 }, () => request(app)
      .post(`/api/vehicles/${vehicle.id}/purchases`)
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ quantity: 1 })));

    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 409)).toHaveLength(4);
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } })).quantity).toBe(0);
    expect(await prisma.purchase.count({ where: { vehicleId: vehicle.id } })).toBe(1);
  });
});
