const express = require("express");
const controller = require("../controllers/purchaseController");
const { asyncHandler } = require("../lib/errors");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();
router.get("/", authenticate, asyncHandler(controller.listPurchases));

module.exports = router;
