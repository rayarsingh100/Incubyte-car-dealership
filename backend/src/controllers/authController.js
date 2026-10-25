const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { HttpError } = require("../lib/errors");
const { getJwtSecret } = require("../config/jwt");

const publicUser = { id: true, name: true, email: true, role: true, createdAt: true };

const register = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100 || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new HttpError(400, "INVALID_INPUT", "A name, valid email, and password of 8 to 72 characters are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, passwordHash },
      select: publicUser,
    });
    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === "P2002") throw new HttpError(409, "EMAIL_EXISTS", "An account with this email already exists.");
    throw error;
  }
};

const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 72) {
    throw new HttpError(400, "INVALID_INPUT", "A valid email and password are required.");
  }

  const secret = getJwtSecret();
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  const token = jwt.sign({}, secret, { subject: user.id, expiresIn: "1h" });
  const { passwordHash, ...safeUser } = user;
  return res.status(200).json({ token, user: safeUser });
};

module.exports = { register, login };
