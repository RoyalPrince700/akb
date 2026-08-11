const express = require("express");

const {
  clearStaffFace,
  createStaff,
  deleteStaff,
  enrollStaffFace,
  getStaff,
  listStaff,
  updateStaff,
  updateStaffStatus,
} = require("../controllers/staff.controller");
const {
  authorize,
  authorizeAdmin,
  protect,
} = require("../middleware/auth.middleware");
const { uploadImage } = require("../middleware/upload.middleware");

const router = express.Router();

router.use(protect);

router.get("/", authorize("hr", "admin", "csrAdmin"), listStaff);
router.get("/:id", authorize("hr", "admin", "csrAdmin"), getStaff);

router.post("/", authorize("admin", "csrAdmin"), createStaff);
router.put("/:id", authorize("admin", "csrAdmin"), updateStaff);
router.patch("/:id/status", authorize("admin", "csrAdmin"), updateStaffStatus);
router.post(
  "/:id/face",
  authorizeAdmin,
  uploadImage.single("face"),
  enrollStaffFace
);
router.delete("/:id/face", authorizeAdmin, clearStaffFace);
router.delete("/:id", authorize("hr", "admin", "csrAdmin"), deleteStaff);

module.exports = router;
