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
  authorize,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/", authorize("hr", "admin", "csrAdmin"), listStaff);
router.get("/:id", authorize("hr", "admin", "csrAdmin"), getStaff);

router.post("/", authorize("admin", "csrAdmin"), createStaff);
router.put("/:id", authorize("admin", "csrAdmin"), updateStaff);
router.patch("/:id/status", authorize("admin", "csrAdmin"), updateStaffStatus);
router.delete("/:id", authorize("admin", "csrAdmin"), deleteStaff);

module.exports = router;
