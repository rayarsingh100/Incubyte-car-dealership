const { rateLimit } = require("express-rate-limit");

const readPositiveInteger = (name, fallback) => {
  const rawValue = process.env[name];
  if (rawValue === undefined) return fallback;
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
};

const loginRateLimit = rateLimit({
  windowMs: readPositiveInteger("LOGIN_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  limit: readPositiveInteger("LOGIN_RATE_LIMIT_MAX", 5),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: "Too many login attempts. Try again later.",
    },
  }),
});

module.exports = loginRateLimit;
