const express = require("express");

const {
  awardGroupPoints,
  createProgress,
  getMonitor,
  getMyWorkspace,
  joinGroup,
  removeGroupMember,
} = require("../controllers/projectAdvance.controller");
const {
  authorizeAdmin,
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/me", getMyWorkspace);
router.post("/join", joinGroup);
router.post("/updates", createProgress);
router.get("/monitor", authorizeHrOrAdmin, getMonitor);
router.post("/points", authorizeHrOrAdmin, awardGroupPoints);
router.delete(
  "/groups/:groupId/members/:userId",
  authorizeAdmin,
  removeGroupMember
);

module.exports = router;
