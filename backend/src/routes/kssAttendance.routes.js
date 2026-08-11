const express = require("express");

const {
  createKssSession,
  getKssSession,
  listKssSessions,
  markByToken,
  previewMarkByToken,
  updateKssSession,
} = require("../controllers/kssAttendance.controller");
const {
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

// Staff (any authenticated active user) mark endpoints — register before /:id
router.get("/mark/:token", previewMarkByToken);
router.post("/mark/:token", markByToken);

// HR / Admin management
router.post("/", authorizeHrOrAdmin, createKssSession);
router.get("/", authorizeHrOrAdmin, listKssSessions);
router.get("/:id", authorizeHrOrAdmin, getKssSession);
router.patch("/:id", authorizeHrOrAdmin, updateKssSession);

module.exports = router;
