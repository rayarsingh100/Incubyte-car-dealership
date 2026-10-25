const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { HttpError } = require("../lib/errors");
const { getJwtSecret } = require("../config/jwt");

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.get("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new HttpError(401, "UNAUTHORIZED", "A valid bearer token is required.");
    }

    const secret = getJwtSecret();

    let payload;
    try {
      payload = jwt.verify(authorization.slice(7), secret);
    } catch {
      throw new HttpError(401, "UNAUTHORIZED", "The bearer token is invalid or expired.");
    }

    if (!payload || typeof payload.sub !== "string") {
      throw new HttpError(401, "UNAUTHORIZED", "The bearer token is invalid or expired.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "The account for this token no longer exists.");

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return next(new HttpError(403, "FORBIDDEN", "Administrator access is required."));
  }
  return next();
};

module.exports = { authenticate, requireAdmin };
