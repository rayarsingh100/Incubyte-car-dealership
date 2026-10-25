const express = require("express");
const { HttpError } = require("./lib/errors");
const prisma = require("./lib/prisma");
const cors = require("./middleware/cors");
const { configureTrustProxy } = require("./config/trustProxy");
const authRoutes = require("./routes/authRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();

configureTrustProxy(app);
app.use(cors);
app.use(express.json({ limit: "1mb" }));

// Liveness only: this endpoint does not connect to or verify PostgreSQL.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.get("/api/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: "ready" });
  } catch {
    return res.status(503).json({ status: "not_ready" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/vehicles", vehicleRoutes);

app.use((req, res, next) => next(new HttpError(404, "NOT_FOUND", "Route not found.")));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error instanceof HttpError ? error.status : error.type === "entity.parse.failed" ? 400 : 500;
  const code = error instanceof HttpError ? error.code : status === 400 ? "INVALID_JSON" : "INTERNAL_ERROR";
  const message = error instanceof HttpError ? error.message : status === 400 ? "Request body must contain valid JSON." : "Internal server error.";
  return res.status(status).json({ error: { code, message } });
});

module.exports = app;
