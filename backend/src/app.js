const express = require("express");
const { HttpError } = require("./lib/errors");
const cors = require("./middleware/cors");
const authRoutes = require("./routes/authRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();

app.use(cors);
app.use(express.json({ limit: "1mb" }));

// Liveness only: this endpoint does not connect to or verify PostgreSQL.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
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
