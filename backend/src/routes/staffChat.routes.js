const express = require("express");

const {
  createMessage,
  deleteMessage,
  listConversations,
  listMessages,
  openConversation,
} = require("../controllers/staffChat.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/conversations", listConversations);
router.post("/conversations", openConversation);
router.get("/conversations/:id/messages", listMessages);
router.post("/conversations/:id/messages", createMessage);
router.delete("/conversations/:id/messages/:messageId", deleteMessage);

module.exports = router;
