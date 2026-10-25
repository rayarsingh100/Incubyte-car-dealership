const { HttpError } = require("../lib/errors");

const isJwtSecretConfigured = () =>
  typeof process.env.JWT_SECRET === "string" && Buffer.byteLength(process.env.JWT_SECRET, "utf8") >= 32;

const getJwtSecret = () => {
  if (!isJwtSecretConfigured()) {
    throw new HttpError(503, "JWT_CONFIGURATION_ERROR", "Authentication is unavailable because JWT configuration is invalid.");
  }
  return process.env.JWT_SECRET;
};

module.exports = { getJwtSecret, isJwtSecretConfigured };
