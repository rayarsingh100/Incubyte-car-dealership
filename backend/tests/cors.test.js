const request = require("supertest");
const app = require("../src/app");

const previousFrontendOrigin = process.env.FRONTEND_ORIGIN;

afterAll(() => {
  if (previousFrontendOrigin === undefined) delete process.env.FRONTEND_ORIGIN;
  else process.env.FRONTEND_ORIGIN = previousFrontendOrigin;
});

beforeEach(() => {
  process.env.FRONTEND_ORIGIN = "https://inventory-demo.example";
});

test("allows the exact configured origin and varies responses by Origin", async () => {
  const response = await request(app).get("/api/health").set("Origin", process.env.FRONTEND_ORIGIN);

  expect(response.status).toBe(200);
  expect(response.headers["access-control-allow-origin"]).toBe(process.env.FRONTEND_ORIGIN);
  expect(response.headers.vary).toContain("Origin");
  expect(response.headers["access-control-allow-credentials"]).toBeUndefined();
});

test("does not grant CORS access to another origin", async () => {
  const response = await request(app).get("/api/health").set("Origin", "https://attacker.example");

  expect(response.status).toBe(200);
  expect(response.headers["access-control-allow-origin"]).toBeUndefined();
});

test("fails closed when FRONTEND_ORIGIN is not a valid HTTP origin", async () => {
  process.env.FRONTEND_ORIGIN = "null";

  const response = await request(app).get("/api/health").set("Origin", "null");

  expect(response.headers["access-control-allow-origin"]).toBeUndefined();
});

test("fails closed for cross-origin requests when FRONTEND_ORIGIN is missing", async () => {
  delete process.env.FRONTEND_ORIGIN;

  const ordinaryRequest = await request(app).get("/api/health").set("Origin", "https://inventory-demo.example");
  const preflight = await request(app)
    .options("/api/vehicles")
    .set("Origin", "https://inventory-demo.example")
    .set("Access-Control-Request-Method", "POST");

  expect(ordinaryRequest.status).toBe(200);
  expect(ordinaryRequest.headers["access-control-allow-origin"]).toBeUndefined();
  expect(preflight.status).toBe(403);
});

test("answers allowed preflight with only supported methods and headers", async () => {
  const response = await request(app)
    .options("/api/vehicles")
    .set("Origin", process.env.FRONTEND_ORIGIN)
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "authorization, content-type");

  expect(response.status).toBe(204);
  expect(response.headers["access-control-allow-origin"]).toBe(process.env.FRONTEND_ORIGIN);
  expect(response.headers["access-control-allow-methods"]).toBe("GET, POST, PATCH, DELETE");
  expect(response.headers["access-control-allow-headers"]).toBe("Authorization, Content-Type");
  expect(response.headers["access-control-allow-credentials"]).toBeUndefined();
});

test("rejects disallowed origins and preflight methods or headers", async () => {
  const disallowedOrigin = await request(app)
    .options("/api/vehicles")
    .set("Origin", "https://attacker.example")
    .set("Access-Control-Request-Method", "POST");
  const disallowedMethod = await request(app)
    .options("/api/vehicles")
    .set("Origin", process.env.FRONTEND_ORIGIN)
    .set("Access-Control-Request-Method", "PUT");
  const disallowedHeader = await request(app)
    .options("/api/vehicles")
    .set("Origin", process.env.FRONTEND_ORIGIN)
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "x-unapproved-header");

  expect(disallowedOrigin.status).toBe(403);
  expect(disallowedMethod.status).toBe(403);
  expect(disallowedHeader.status).toBe(403);
});
