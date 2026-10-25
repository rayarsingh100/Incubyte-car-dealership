process.env.JWT_SECRET = "test-only-jwt-secret-that-is-at-least-32-characters";
process.env.LOGIN_RATE_LIMIT_MAX = "100";

jest.mock("../src/lib/prisma", () => require("./support/prismaMock"));

const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

const userData = { name: "Regular User", email: "user@example.com", password: "SecurePass123!" };
const adminData = { name: "Admin User", email: "admin@example.com", password: "SecurePass123!" };
const vehicleData = { make: "Toyota", model: "Corolla", category: "Sedan", price: 25000, quantity: 4 };
let userToken;
let adminToken;

const registerAndLogin = async (data, role) => {
  await request(app).post("/api/auth/register").send(data);
  if (role) prisma.setRole(data.email, role);
  const response = await request(app).post("/api/auth/login").send({ email: data.email, password: data.password });
  return response.body.token;
};

const createVehicle = async (token = adminToken, data = vehicleData) => {
  const response = await request(app).post("/api/vehicles").set("Authorization", `Bearer ${token}`).send(data);
  return response;
};

beforeEach(async () => {
  prisma.reset();
  userToken = await registerAndLogin(userData);
  adminToken = await registerAndLogin(adminData, "ADMIN");
});

describe("vehicle inventory", () => {
  test("restricts inventory writes to administrators", async () => {
    const response = await createVehicle(userToken);
    expect(response.status).toBe(403);
    expect((await request(app).post("/api/vehicles").send(vehicleData)).status).toBe(401);
  });

  test("prevents regular users from updating or deleting vehicles", async () => {
    const vehicle = await createVehicle();
    const id = vehicle.body.vehicle.id;

    const updated = await request(app)
      .patch(`/api/vehicles/${id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ price: 20000 });
    const deleted = await request(app)
      .delete(`/api/vehicles/${id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(updated.status).toBe(403);
    expect(deleted.status).toBe(403);
    expect(prisma.getVehicle(id).price).toBe("25000.00");
  });

  test("creates, retrieves, updates, and deletes a vehicle", async () => {
    const created = await createVehicle();
    expect(created.status).toBe(201);
    const id = created.body.vehicle.id;
    expect((await request(app).get(`/api/vehicles/${id}`)).body.vehicle.make).toBe("Toyota");
    const updated = await request(app).patch(`/api/vehicles/${id}`).set("Authorization", `Bearer ${adminToken}`).send({ price: 24000 });
    expect(updated.status).toBe(200);
    expect(updated.body.vehicle.price).toBe("24000.00");
    const deleted = await request(app).delete(`/api/vehicles/${id}`).set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
    expect((await request(app).get(`/api/vehicles/${id}`)).status).toBe(404);
  });

  test("accepts valid optional image URLs on create and update, including clearing an image", async () => {
    const imageUrl = "https://images.example.test/cars/toyota.jpg";
    const created = await createVehicle(adminToken, { ...vehicleData, imageUrl });

    expect(created.status).toBe(201);
    expect(created.body.vehicle.imageUrl).toBe(imageUrl);
    expect(prisma.getVehicle(created.body.vehicle.id).imageUrl).toBe(imageUrl);
    expect((await request(app).get(`/api/vehicles/${created.body.vehicle.id}`)).body.vehicle.imageUrl).toBe(imageUrl);
    const listResponse = await request(app).get("/api/vehicles?search=Toyota");
    expect(listResponse.body.vehicles.find((vehicle) => vehicle.id === created.body.vehicle.id).imageUrl).toBe(imageUrl);

    const updatedUrl = "http://images.example.test/cars/updated.png";
    const updated = await request(app)
      .patch(`/api/vehicles/${created.body.vehicle.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ imageUrl: updatedUrl });
    expect(updated.status).toBe(200);
    expect(updated.body.vehicle.imageUrl).toBe(updatedUrl);

    const invalidUpdate = await request(app)
      .patch(`/api/vehicles/${created.body.vehicle.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ imageUrl: "data:image/png;base64,not-a-valid-source" });
    expect(invalidUpdate.status).toBe(400);

    const cleared = await request(app)
      .patch(`/api/vehicles/${created.body.vehicle.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ imageUrl: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.vehicle.imageUrl).toBeNull();
  });

  test.each([
    "javascript:alert(1)",
    "ftp://images.example.test/car.jpg",
    "https://user:password@images.example.test/car.jpg",
    "https://",
    "not-a-url",
    `https://images.example.test/${"a".repeat(2050)}`,
  ])("rejects invalid image URL %s", async (imageUrl) => {
    const response = await createVehicle(adminToken, { ...vehicleData, imageUrl });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  test("rejects unknown vehicle fields instead of passing them through to Prisma", async () => {
    const response = await createVehicle(adminToken, { ...vehicleData, imageUrl: null, admin: true });
    expect(response.status).toBe(400);
    expect(prisma.vehicle.create).not.toHaveBeenCalled();
  });

  test("rejects invalid data, invalid IDs, and missing vehicles", async () => {
    expect((await createVehicle(adminToken, { ...vehicleData, price: 0 })).status).toBe(400);
    expect((await request(app).get("/api/vehicles/not-an-id")).status).toBe(400);
    expect((await request(app).get("/api/vehicles/00000000-0000-4000-8000-000000000001")).status).toBe(404);
    expect((await request(app).patch("/api/vehicles/00000000-0000-4000-8000-000000000001").set("Authorization", `Bearer ${adminToken}`).send({ model: "New" })).status).toBe(404);
  });

  test("lists vehicles with pagination, search, and filters", async () => {
    await createVehicle(adminToken);
    await createVehicle(adminToken, { make: "Honda", model: "Civic", category: "Sedan", price: 22000, quantity: 0 });
    await createVehicle(adminToken, { make: "Toyota", model: "RAV4", category: "SUV", price: 35000, quantity: 2 });
    const page = await request(app).get("/api/vehicles?page=2&limit=1");
    expect(page.status).toBe(200);
    expect(page.body.vehicles).toHaveLength(1);
    expect(page.body.pagination).toMatchObject({ page: 2, limit: 1, total: 3, pages: 3 });
    const filtered = await request(app).get("/api/vehicles?search=toyota&category=SUV&minPrice=30000&inStock=true");
    expect(filtered.body.vehicles).toHaveLength(1);
    expect(filtered.body.vehicles[0].model).toBe("RAV4");
    expect((await request(app).get("/api/vehicles?page=0")).status).toBe(400);
  });

  test("rejects purchases with invalid quantities and insufficient stock", async () => {
    const vehicle = await createVehicle();
    const url = `/api/vehicles/${vehicle.body.vehicle.id}/purchases`;
    expect((await request(app).post(url).set("Authorization", `Bearer ${userToken}`).send({ quantity: 0 })).status).toBe(400);
    const unavailable = await request(app).post(url).set("Authorization", `Bearer ${userToken}`).send({ quantity: 5 });
    expect(unavailable.status).toBe(409);
    expect(prisma.getVehicle(vehicle.body.vehicle.id).quantity).toBe(4);
  });

  test("prevents overselling across concurrent purchase attempts", async () => {
    const vehicle = await createVehicle(adminToken, { ...vehicleData, quantity: 1 });
    const url = `/api/vehicles/${vehicle.body.vehicle.id}/purchases`;
    const responses = await Promise.all([
      request(app).post(url).set("Authorization", `Bearer ${userToken}`).send({ quantity: 1 }),
      request(app).post(url).set("Authorization", `Bearer ${userToken}`).send({ quantity: 1 }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(prisma.getVehicle(vehicle.body.vehicle.id).quantity).toBe(0);
    expect(prisma.getPurchaseCount()).toBe(1);
  });

  test("allows administrators to restock and delete inventory", async () => {
    const vehicle = await createVehicle();
    const url = `/api/vehicles/${vehicle.body.vehicle.id}/restock`;
    expect((await request(app).post(url).set("Authorization", `Bearer ${userToken}`).send({ quantity: 2 })).status).toBe(403);
    const restocked = await request(app).post(url).set("Authorization", `Bearer ${adminToken}`).send({ quantity: 2 });
    expect(restocked.status).toBe(200);
    expect(restocked.body.vehicle.quantity).toBe(6);
    expect((await request(app).delete(`/api/vehicles/${vehicle.body.vehicle.id}`).set("Authorization", `Bearer ${adminToken}`)).status).toBe(200);
  });

  test("rejects a restock that would exceed the database quantity limit", async () => {
    const vehicle = await createVehicle(adminToken, { ...vehicleData, quantity: 2147483647 });
    const response = await request(app).post(`/api/vehicles/${vehicle.body.vehicle.id}/restock`).set("Authorization", `Bearer ${adminToken}`).send({ quantity: 1 });
    expect(response.status).toBe(409);
  });

  test("prevents deleting a vehicle with purchase history", async () => {
    const vehicle = await createVehicle();
    await request(app).post(`/api/vehicles/${vehicle.body.vehicle.id}/purchases`).set("Authorization", `Bearer ${userToken}`).send({ quantity: 1 });
    const response = await request(app).delete(`/api/vehicles/${vehicle.body.vehicle.id}`).set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(409);
  });
});
