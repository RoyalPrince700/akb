const express = require("express");

const {
  createStaff,
  deleteStaff,
  getStaff,
  listStaff,
  updateStaff,
  updateStaffStatus,
} = require("../controllers/staff.controller");
const {
  authorizeAdmin,
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/", authorizeHrOrAdmin, listStaff);
router.get("/:id", authorizeHrOrAdmin, getStaff);

router.post("/", authorizeAdmin, createStaff);
router.put("/:id", authorizeAdmin, updateStaff);
router.patch("/:id/status", authorizeAdmin, updateStaffStatus);
router.delete("/:id", authorizeAdmin, deleteStaff);

module.exports = router;
