const { HttpError } = require("./errors");

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const requireVehicleId = (id) => {
  if (typeof id !== "string" || !uuidPattern.test(id)) {
    throw new HttpError(400, "INVALID_ID", "A valid vehicle id is required.");
  }
  return id;
};

const requiredText = (value, field) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100) {
    throw new HttpError(400, "INVALID_INPUT", `${field} must be a non-empty string of at most 100 characters.`);
  }
  return value.trim();
};

const validatePrice = (value) => {
  const cents = Math.round(value * 100);
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 9999999999.99 || Math.abs(value * 100 - cents) > 1e-8) {
    throw new HttpError(400, "INVALID_INPUT", "price must be a positive amount with at most two decimal places.");
  }
  return value.toFixed(2);
};

const validateQuantity = (value, field = "quantity", allowZero = false) => {
  if (!Number.isInteger(value) || value < (allowZero ? 0 : 1) || value > 2147483647) {
    throw new HttpError(400, "INVALID_INPUT", `${field} must be a ${allowZero ? "non-negative" : "positive"} integer.`);
  }
  return value;
};

const parsePositiveInteger = (value, field, fallback, maximum) => {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > maximum) {
    throw new HttpError(400, "INVALID_QUERY", `${field} must be an integer between 1 and ${maximum}.`);
  }
  return Number(value);
};

module.exports = { requireVehicleId, requiredText, validatePrice, validateQuantity, parsePositiveInteger };
