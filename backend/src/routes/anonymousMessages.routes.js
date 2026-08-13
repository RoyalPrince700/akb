const express = require("express");

const {
  createSession,
  getSession,
  listSessions,
  previewByToken,
  submitByToken,
  updateSession,
} = require("../controllers/anonymousMessages.controller");
const {
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Public token endpoints — no auth (register before protect and before /:id)
router.get("/public/:token", previewByToken);
router.post("/public/:token", submitByToken);

router.use(protect);

// HR / Admin management
router.post("/", authorizeHrOrAdmin, createSession);
router.get("/", authorizeHrOrAdmin, listSessions);
router.get("/:id", authorizeHrOrAdmin, getSession);
router.patch("/:id", authorizeHrOrAdmin, updateSession);

module.exports = router;
