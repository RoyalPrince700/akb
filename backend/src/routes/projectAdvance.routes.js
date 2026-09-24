const express = require("express");

const {
  assignGroupMember,
  awardGroupPoints,
  createProgress,
  getMonitor,
  getMyWorkspace,
  joinGroup,
  removeGroupMember,
  reviewProgressReceipt,
  setGroupTeamLead,
} = require("../controllers/projectAdvance.controller");
const {
  authorizeAdmin,
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");
const { uploadImage } = require("../middleware/upload.middleware");

const router = express.Router();

router.use(protect);

router.get("/me", getMyWorkspace);
router.post("/join", joinGroup);
router.post("/updates", uploadImage.single("receipt"), createProgress);
router.post(
  "/updates/:updateId/review",
  authorizeHrOrAdmin,
  reviewProgressReceipt
);
router.get("/monitor", authorizeHrOrAdmin, getMonitor);
router.post("/points", authorizeHrOrAdmin, awardGroupPoints);
router.post(
  "/groups/:groupId/members",
  authorizeHrOrAdmin,
  assignGroupMember
);
router.patch(
  "/groups/:groupId/members/:userId/team-lead",
  authorizeHrOrAdmin,
  setGroupTeamLead
);
router.delete(
  "/groups/:groupId/members/:userId",
  authorizeAdmin,
  removeGroupMember
);

module.exports = router;
