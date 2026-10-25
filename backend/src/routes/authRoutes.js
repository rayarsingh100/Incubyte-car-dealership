const express = require("express");
const { register, login } = require("../controllers/authController");
const { asyncHandler } = require("../lib/errors");
const loginRateLimit = require("../middleware/loginRateLimit");

const router = express.Router();
router.post("/register", asyncHandler(register));
router.post("/login", loginRateLimit, asyncHandler(login));

module.exports = router;
