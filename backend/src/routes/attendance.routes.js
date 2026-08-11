const express = require("express");

const {
  exportAttendance,
  getAttendanceSummary,
  listAttendance,
  listEnrolledFaces,
  listTodayAttendance,
  markAttendance,
} = require("../controllers/attendance.controller");
const {
  authorizeHrOrAdmin,
  authorizeSecurity,
  authorizeSecurityOrAdmin,
  protect,
} = require("../middleware/auth.middleware");
const { uploadImage } = require("../middleware/upload.middleware");

const router = express.Router();

router.use(protect);

// Security kiosk
router.get("/enrolled-faces", authorizeSecurityOrAdmin, listEnrolledFaces);
router.get("/today", authorizeSecurityOrAdmin, listTodayAttendance);
router.post(
  "/punch",
  authorizeSecurity,
  uploadImage.single("snapshot"),
  markAttendance
);
router.post(
  "/check-in",
  authorizeSecurity,
  uploadImage.single("snapshot"),
  (req, res, next) => {
    req.body.type = "in";
    return markAttendance(req, res, next);
  }
);
router.post(
  "/check-out",
  authorizeSecurity,
  uploadImage.single("snapshot"),
  (req, res, next) => {
    req.body.type = "out";
    return markAttendance(req, res, next);
  }
);

// HR / Admin reporting (register before bare "/" if adding params later)
router.get("/summary", authorizeHrOrAdmin, getAttendanceSummary);
router.get("/export", authorizeHrOrAdmin, exportAttendance);
router.get("/", authorizeHrOrAdmin, listAttendance);

module.exports = router;
