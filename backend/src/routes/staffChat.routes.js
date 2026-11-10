const express = require("express");

const {
  createMessage,
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

module.exports = router;
