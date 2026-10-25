const { assertDedicatedTestDatabase } = require("../../scripts/testDatabaseGuard");

assertDedicatedTestDatabase({
  requireDatabaseUrlMatch: true,
  printTarget: process.env.TEST_DATABASE_TARGET_PRINTED !== "1",
});

const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
const otherUser = {
  name: "Other Integration User",
  email: `integration-other-${suffix}@example.test`,
  password: "IntegrationPass123!",
};
let regularToken;
let adminToken;
let otherToken;
let regularUserId;
let otherUserId;
let protectedVehicleId;
const createdUserIds = new Set();
const createdVehicleIds = new Set();

const vehiclePayload = (quantity = 5, model = `Model-${suffix.slice(0, 8)}`) => ({
  make: "Integration Motors",
  model,
  category: "Test Vehicle",
  price: 12345.67,
  quantity,
});

const register = async (account) => {
  const response = await request(app).post("/api/auth/register").send(account);
  if (response.status === 201 && response.body.user?.id) createdUserIds.add(response.body.user.id);
  return response;
};
const login = async (account) => request(app).post("/api/auth/login").send({ email: account.email, password: account.password });
const createVehicle = async (quantity = 5, model) => {
  const response = await request(app)
    .post("/api/vehicles")
    .set("Authorization", `Bearer ${adminToken}`)
    .send(vehiclePayload(quantity, model));
  expect(response.status).toBe(201);
  createdVehicleIds.add(response.body.vehicle.id);
  return response.body.vehicle;
};

beforeAll(async () => {
  const registeredRegular = await register(regularUser);
  expect(registeredRegular.status).toBe(201);
  regularUserId = registeredRegular.body.user.id;

  const regularRecord = await prisma.user.findUnique({ where: { email: regularUser.email } });
  expect(regularRecord.passwordHash).not.toBe(regularUser.password);
  expect(await bcrypt.compare(regularUser.password, regularRecord.passwordHash)).toBe(true);

  const registeredAdmin = await register(adminUser);
  expect(registeredAdmin.status).toBe(201);
  const adminUserId = registeredAdmin.body.user.id;
  expect(registeredAdmin.body.user.role).toBe("USER");
  await prisma.user.update({ where: { id: adminUserId }, data: { role: "ADMIN" } });

  const registeredOther = await register(otherUser);
  expect(registeredOther.status).toBe(201);
  otherUserId = registeredOther.body.user.id;

  const [regularLogin, adminLogin, otherLogin] = await Promise.all([login(regularUser), login(adminUser), login(otherUser)]);
  expect(regularLogin.status).toBe(200);
  expect(adminLogin.status).toBe(200);
  expect(otherLogin.status).toBe(200);
  expect(regularLogin.body.user).not.toHaveProperty("passwordHash");
  regularToken = regularLogin.body.token;
  adminToken = adminLogin.body.token;
  otherToken = otherLogin.body.token;
  protectedVehicleId = (await createVehicle(3)).id;
});

afterAll(async () => {
  try {
    const userIds = [...createdUserIds];
    const vehicleIds = [...createdVehicleIds];
    const purchaseConditions = [];
    if (userIds.length) purchaseConditions.push({ userId: { in: userIds } });
    if (vehicleIds.length) purchaseConditions.push({ vehicleId: { in: vehicleIds } });
    if (purchaseConditions.length) await prisma.purchase.deleteMany({ where: { OR: purchaseConditions } });
    if (vehicleIds.length) await prisma.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  } finally {
    await prisma.$disconnect();
  }
});

describe("dedicated PostgreSQL API integration", () => {
  test("rejects duplicate registrations and invalid registration input", async () => {
    expect((await register(regularUser)).status).toBe(409);
    expect((await register({ name: "", email: "invalid", password: "short" })).status).toBe(400);
  });

  test("issues and verifies JWTs on protected routes", async () => {
    expect((await request(app).post(`/api/vehicles/${protectedVehicleId}/purchases`).send({ quantity: 1 })).status).toBe(401);
    expect((await request(app).post(`/api/vehicles/${protectedVehicleId}/purchases`).set("Authorization", "Bearer invalid").send({ quantity: 1 })).status).toBe(401);
    const expiredToken = jwt.sign({}, process.env.JWT_SECRET, { subject: regularUserId, expiresIn: -1 });
    expect((await request(app).post(`/api/vehicles/${protectedVehicleId}/purchases`).set("Authorization", `Bearer ${expiredToken}`).send({ quantity: 1 })).status).toBe(401);
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

  test("lists only this run's matching vehicles across pages", async () => {
    const first = await createVehicle(2, `PageOne-${suffix}`);
    const second = await createVehicle(4, `PageTwo-${suffix}`);
    const query = `search=${encodeURIComponent(suffix)}&limit=1`;
    const pageOne = await request(app).get(`/api/vehicles?${query}&page=1`);
    const pageTwo = await request(app).get(`/api/vehicles?${query}&page=2`);

    expect(pageOne.status).toBe(200);
    expect(pageTwo.status).toBe(200);
    expect(pageOne.body.pagination).toMatchObject({ page: 1, limit: 1, total: 2, pages: 2 });
    expect(pageTwo.body.pagination).toMatchObject({ page: 2, limit: 1, total: 2, pages: 2 });
    expect(new Set([pageOne.body.vehicles[0].id, pageTwo.body.vehicles[0].id])).toEqual(new Set([first.id, second.id]));
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

  test("persists successful demo purchases and exposes them to admins without leaking them to other customers", async () => {
    const vehicle = await createVehicle(3);
    const purchaseResponse = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchases`)
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ quantity: 2, demoPaymentOutcome: "success" });

    expect(purchaseResponse.status).toBe(201);
    const purchaseId = purchaseResponse.body.purchase.id;
    const persisted = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { user: true, vehicle: true },
    });
    expect(persisted).toMatchObject({
      id: purchaseId,
      userId: regularUserId,
      vehicleId: vehicle.id,
      quantity: 2,
      paymentStatus: "SUCCEEDED",
      paymentMethod: "DEMO_CARD",
      user: { id: regularUserId },
      vehicle: { id: vehicle.id, quantity: 1 },
    });

    const adminHistory = await request(app)
      .get("/api/purchases?page=1&limit=100")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminHistory.status).toBe(200);
    expect(adminHistory.body.purchases).toContainEqual(expect.objectContaining({
      id: purchaseId,
      vehicleId: vehicle.id,
      quantity: 2,
      paymentStatus: "SUCCEEDED",
      user: { id: regularUserId, name: regularUser.name, email: regularUser.email },
      vehicle: expect.objectContaining({ id: vehicle.id }),
    }));

    const otherHistory = await request(app)
      .get("/api/purchases?page=1&limit=100")
      .set("Authorization", `Bearer ${otherToken}`);
    expect(otherHistory.status).toBe(200);
    expect(otherHistory.body.purchases.some(({ id }) => id === purchaseId)).toBe(false);
  });

  test.each(["failure", "cancelled"])("does not persist a %s demo payment or decrement stock", async (outcome) => {
    const vehicle = await createVehicle(2);
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchases`)
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ quantity: 1, demoPaymentOutcome: outcome });

    expect(response.status).toBe(outcome === "failure" ? 402 : 409);
    expect(await prisma.purchase.count({ where: { vehicleId: vehicle.id } })).toBe(0);
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } })).quantity).toBe(2);
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

  test("returns empty purchase history, then paginates only the authenticated user's records", async () => {
    const empty = await request(app).get("/api/purchases").set("Authorization", `Bearer ${otherToken}`);
    expect(empty.status).toBe(200);
    expect(empty.body).toMatchObject({ purchases: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });

    const ownVehicleOne = await createVehicle(5);
    const ownVehicleTwo = await createVehicle(5);
    const otherVehicle = await createVehicle(5);
    const ownPurchaseOne = await request(app).post(`/api/vehicles/${ownVehicleOne.id}/purchases`).set("Authorization", `Bearer ${regularToken}`).send({ quantity: 1 });
    const ownPurchaseTwo = await request(app).post(`/api/vehicles/${ownVehicleTwo.id}/purchases`).set("Authorization", `Bearer ${regularToken}`).send({ quantity: 2 });
    const otherPurchase = await request(app).post(`/api/vehicles/${otherVehicle.id}/purchases`).set("Authorization", `Bearer ${otherToken}`).send({ quantity: 1 });
    expect([ownPurchaseOne.status, ownPurchaseTwo.status, otherPurchase.status]).toEqual([201, 201, 201]);

    const query = `userId=${encodeURIComponent(otherUserId)}&page=1&limit=1`;
    const pageOne = await request(app).get(`/api/purchases?${query}`).set("Authorization", `Bearer ${regularToken}`);
    const pageTwo = await request(app).get(`/api/purchases?${query.replace("page=1", "page=2")}`).set("Authorization", `Bearer ${regularToken}`);
    expect(pageOne.status).toBe(200);
    expect(pageTwo.status).toBe(200);
    expect(pageOne.body.pagination).toMatchObject({ page: 1, limit: 1, total: 2, pages: 2 });
    expect(pageTwo.body.pagination).toMatchObject({ page: 2, limit: 1, total: 2, pages: 2 });
    const ownRecords = [...pageOne.body.purchases, ...pageTwo.body.purchases];
    expect(ownRecords).toHaveLength(2);
    expect(new Set(ownRecords.map((purchase) => purchase.vehicleId))).toEqual(new Set([ownVehicleOne.id, ownVehicleTwo.id]));
    expect(ownRecords.every((purchase) => purchase.vehicleId !== otherVehicle.id && !("userId" in purchase))).toBe(true);
    expect(ownRecords.map((purchase) => purchase.id)).toEqual(ownRecords.slice().sort((a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id),
    ).map((purchase) => purchase.id));
    expect(ownRecords[0]).toHaveProperty("totalAmount");

    const otherHistory = await request(app).get(`/api/purchases?userId=${encodeURIComponent(regularUserId)}`).set("Authorization", `Bearer ${otherToken}`);
    expect(otherHistory.status).toBe(200);
    expect(otherHistory.body.purchases).toHaveLength(1);
    expect(otherHistory.body.purchases[0].vehicleId).toBe(otherVehicle.id);
  });
});
