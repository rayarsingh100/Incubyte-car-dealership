const prisma = require("../lib/prisma");
const { HttpError } = require("../lib/errors");
const { requireVehicleId, requiredText, validatePrice, validateQuantity, parsePositiveInteger } = require("../lib/validation");

const requiredVehicleFields = ["make", "model", "category", "price", "quantity"];
const vehicleFields = [...requiredVehicleFields, "imageUrl"];

const validateImageUrl = (value) => {
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_INPUT", "imageUrl must be an HTTP or HTTPS URL, or null.");
  }

  const imageUrl = value.trim();
  if (!imageUrl || imageUrl.length > 2048) {
    throw new HttpError(400, "INVALID_INPUT", "imageUrl must be a non-empty URL of at most 2048 characters, or null.");
  }

  try {
    const parsedUrl = new URL(imageUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol) || !parsedUrl.hostname || parsedUrl.username || parsedUrl.password) {
      throw new Error("Invalid image URL.");
    }
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "imageUrl must be a valid HTTP or HTTPS URL, or null.");
  }

  return imageUrl;
};

const formatTotalAmount = (unitPrice, quantity) => {
  const [whole, fraction = ""] = String(unitPrice).split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2));
  const totalCents = cents * BigInt(quantity);
  return `${totalCents / 100n}.${String(totalCents % 100n).padStart(2, "0")}`;
};

const vehicleData = (body, partial) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_INPUT", "A JSON object is required.");
  }
  const keys = Object.keys(body);
  if (keys.some((key) => !vehicleFields.includes(key))) {
    throw new HttpError(400, "INVALID_INPUT", "Only make, model, category, price, quantity, and imageUrl can be set.");
  }
  if (!keys.length || (!partial && requiredVehicleFields.some((key) => !keys.includes(key)))) {
    throw new HttpError(400, "INVALID_INPUT", partial ? "At least one vehicle field is required." : "All vehicle fields are required.");
  }
  const data = {};
  for (const key of keys) {
    if (["make", "model", "category"].includes(key)) data[key] = requiredText(body[key], key);
    if (key === "price") data.price = validatePrice(body.price);
    if (key === "quantity") data.quantity = validateQuantity(body.quantity, "quantity", true);
    if (key === "imageUrl") data.imageUrl = validateImageUrl(body.imageUrl);
  }
  return data;
};

const listVehicles = async (req, res) => {
  const page = parsePositiveInteger(req.query.page, "page", 1, 1000000);
  const limit = parsePositiveInteger(req.query.limit, "limit", 20, 100);
  const where = {};
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  if (search.length > 100) throw new HttpError(400, "INVALID_QUERY", "search must be at most 100 characters.");
  if (search) {
    where.OR = ["make", "model", "category"].map((field) => ({ [field]: { contains: search, mode: "insensitive" } }));
  }
  for (const field of ["make", "model", "category"]) {
    if (req.query[field] !== undefined) where[field] = requiredText(req.query[field], field);
  }
  if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
    where.price = {};
    for (const [field, operator] of [["minPrice", "gte"], ["maxPrice", "lte"]]) {
      if (req.query[field] === undefined) continue;
      const value = Number(req.query[field]);
      if (!Number.isFinite(value) || value < 0) throw new HttpError(400, "INVALID_QUERY", `${field} must be a non-negative amount.`);
      where.price[operator] = value;
    }
    if (where.price.gte !== undefined && where.price.lte !== undefined && where.price.gte > where.price.lte) {
      throw new HttpError(400, "INVALID_QUERY", "minPrice cannot exceed maxPrice.");
    }
  }
  if (req.query.inStock !== undefined) {
    if (!["true", "false"].includes(req.query.inStock)) throw new HttpError(400, "INVALID_QUERY", "inStock must be true or false.");
    where.quantity = req.query.inStock === "true" ? { gt: 0 } : 0;
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.vehicle.count({ where }),
  ]);
  return res.status(200).json({ vehicles, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

const getVehicle = async (req, res) => {
  const id = requireVehicleId(req.params.id);
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new HttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
  return res.status(200).json({ vehicle });
};

const createVehicle = async (req, res) => {
  const vehicle = await prisma.vehicle.create({ data: vehicleData(req.body, false) });
  return res.status(201).json({ vehicle });
};

const updateVehicle = async (req, res) => {
  const id = requireVehicleId(req.params.id);
  const data = vehicleData(req.body, true);
  try {
    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    return res.status(200).json({ vehicle });
  } catch (error) {
    if (error.code === "P2025") throw new HttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    throw error;
  }
};

const deleteVehicle = async (req, res) => {
  const id = requireVehicleId(req.params.id);
  try {
    await prisma.vehicle.delete({ where: { id } });
    return res.status(200).json({ message: "Vehicle deleted." });
  } catch (error) {
    if (error.code === "P2025") throw new HttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    if (error.code === "P2003") throw new HttpError(409, "VEHICLE_HAS_PURCHASES", "A vehicle with purchase history cannot be deleted.");
    throw error;
  }
};

const restockVehicle = async (req, res) => {
  const id = requireVehicleId(req.params.id);
  const { quantity } = req.body || {};
  validateQuantity(quantity);
  const updated = await prisma.vehicle.updateMany({
    where: { id, quantity: { lte: 2147483647 - quantity } },
    data: { quantity: { increment: quantity } },
  });
  if (updated.count === 0) {
    const existing = await prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new HttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    throw new HttpError(409, "QUANTITY_LIMIT", "Restocking would exceed the maximum inventory quantity.");
  }
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  return res.status(200).json({ vehicle });
};

const purchaseVehicle = async (req, res) => {
  const vehicleId = requireVehicleId(req.params.id);
  const { quantity, demoPaymentOutcome = "success" } = req.body || {};
  validateQuantity(quantity);
  if (!["success", "failure", "cancelled"].includes(demoPaymentOutcome)) {
    throw new HttpError(400, "INVALID_PAYMENT_OUTCOME", "demoPaymentOutcome must be success, failure, or cancelled.");
  }
  if (demoPaymentOutcome === "failure") {
    throw new HttpError(402, "DEMO_PAYMENT_FAILED", "The demo payment was declined. No order was placed.");
  }
  if (demoPaymentOutcome === "cancelled") {
    throw new HttpError(409, "DEMO_PAYMENT_CANCELLED", "The demo payment was cancelled. No order was placed.");
  }
  const result = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.vehicle.updateMany({
      where: { id: vehicleId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });
    if (updated.count === 0) {
      const existing = await transaction.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
      if (!existing) throw new HttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
      throw new HttpError(409, "INSUFFICIENT_STOCK", "The requested quantity is not available.");
    }
    const vehicle = await transaction.vehicle.findUnique({ where: { id: vehicleId } });
    const purchase = await transaction.purchase.create({
      data: {
        userId: req.user.id,
        vehicleId,
        quantity,
        unitPrice: vehicle.price,
        paymentStatus: "SUCCEEDED",
        paymentMethod: "DEMO_CARD",
      },
    });
    return { purchase: { ...purchase, totalAmount: formatTotalAmount(purchase.unitPrice, purchase.quantity) }, vehicle };
  });
  return res.status(201).json(result);
};

module.exports = { listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, restockVehicle, purchaseVehicle };
