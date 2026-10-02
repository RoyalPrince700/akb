const express = require("express");

const {
  assignGroupMember,
  awardReceiptPoints,
  createProgress,
  getMonitor,
  getMyWorkspace,
  getReceiptDesk,
  joinGroup,
  leaveGroup,
  removeGroupMember,
  switchGroup,
  reviewProgressReceipt,
  setGroupTeamLead,
} = require("../controllers/projectAdvance.controller");
const {
  authorize,
  authorizeAdmin,
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");
const { uploadImage } = require("../middleware/upload.middleware");

const router = express.Router();

router.use(protect);

router.get("/me", getMyWorkspace);
router.post("/join", joinGroup);
router.post("/leave", leaveGroup);
router.post("/switch", switchGroup);
router.post("/updates", uploadImage.single("receipt"), createProgress);
router.get("/receipts", authorize("accountOfficer"), getReceiptDesk);
router.post(
  "/updates/:updateId/review",
  authorize("accountOfficer"),
  reviewProgressReceipt
);
router.post(
  "/updates/:updateId/points",
  authorizeHrOrAdmin,
  awardReceiptPoints
);
router.get("/monitor", authorizeHrOrAdmin, getMonitor);
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
