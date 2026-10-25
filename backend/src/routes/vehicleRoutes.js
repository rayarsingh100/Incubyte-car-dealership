const express = require("express");
const controller = require("../controllers/vehicleController");
const { asyncHandler } = require("../lib/errors");
const { authenticate, requireAdmin } = require("../middleware/authenticate");

const router = express.Router();
router.get("/search", asyncHandler(controller.listVehicles));
router.get("/", asyncHandler(controller.listVehicles));
router.get("/:id", asyncHandler(controller.getVehicle));
router.post("/", authenticate, requireAdmin, asyncHandler(controller.createVehicle));
router.put("/:id", authenticate, requireAdmin, asyncHandler(controller.updateVehicle));
router.patch("/:id", authenticate, requireAdmin, asyncHandler(controller.updateVehicle));
router.delete("/:id", authenticate, requireAdmin, asyncHandler(controller.deleteVehicle));
router.post("/:id/purchase", authenticate, asyncHandler(controller.purchaseVehicle));
router.post("/:id/purchases", authenticate, asyncHandler(controller.purchaseVehicle));
router.post("/:id/restock", authenticate, requireAdmin, asyncHandler(controller.restockVehicle));

module.exports = router;
