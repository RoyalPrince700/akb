const mongoose = require("mongoose");

const StaffConversation = require("../models/StaffConversation");
const User = require("../models/User");
const { emitToUsers } = require("../realtime/io");
const asyncHandler = require("../utils/asyncHandler");

const PEOPLE_FIELDS = "name department position role avatar";

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const peerFromConversation = (conversation, userId) => {
  const mine = String(userId);
  const peer = (conversation.participants || []).find(
    (person) => String(person?._id || person) !== mine
  );
  return peer;
};

const readReplyTo = (raw) => {
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    try {
      value = JSON.parse(trimmed);
    } catch {
      return undefined;
    }
  }
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const preview = String(value.preview || "").trim().slice(0, 160);
  if (!preview) {
    return undefined;
  }
  return {
    messageId: String(value.messageId || "").slice(0, 40),
    authorName: String(value.authorName || "Someone").trim().slice(0, 80) || "Someone",
    preview,
  };
};

const visibleBody = (message) => {
  if (!message) {
    return "";
  }
  if (message.deletedAt || message.deletedKind) {
    return message.deletedKind === "media" ? "Media deleted" : "This has been deleted";
  }
  return message.body || "";
};

const latestMessage = (messages) => {
  const list = messages || [];
  if (!list.length) {
    return null;
  }
  return list[list.length - 1];
};

const summarizeConversation = (conversation, userId) => {
  const peer = peerFromConversation(conversation, userId);
  const last = latestMessage(conversation.messages);
  return {
    _id: String(conversation._id),
    type: "direct",
    peer,
    lastMessage: last
      ? {
          body: visibleBody(last),
          createdAt: last.createdAt,
          author: last.author,
        }
      : null,
    updatedAt: conversation.updatedAt,
  };
};

const listConversations = asyncHandler(async (req, res) => {
  const conversations = await StaffConversation.find({
    participants: req.user._id,
  })
    .populate("participants", PEOPLE_FIELDS)
    .populate("messages.author", PEOPLE_FIELDS)
    .sort({ updatedAt: -1 })
    .limit(80)
    .lean();

  res.json({
    conversations: conversations.map((entry) => summarizeConversation(entry, req.user._id)),
  });
});

const openConversation = asyncHandler(async (req, res) => {
  const peerId = String(req.body.peerId || "").trim();
  if (!mongoose.Types.ObjectId.isValid(peerId)) {
    fail(res, 400, "Choose a valid teammate");
  }
  if (peerId === String(req.user._id)) {
    fail(res, 400, "You cannot message yourself");
  }

  const peer = await User.findOne({ _id: peerId, isActive: true }).select(PEOPLE_FIELDS);
  if (!peer) {
    fail(res, 404, "Teammate not found");
  }

  let conversation = await StaffConversation.findOne({
    participants: { $all: [req.user._id, peerId], $size: 2 },
  })
    .populate("participants", PEOPLE_FIELDS)
    .populate("messages.author", PEOPLE_FIELDS);

  if (!conversation) {
    conversation = await StaffConversation.create({
      participants: [req.user._id, peerId],
      messages: [],
    });
    conversation = await StaffConversation.findById(conversation._id)
      .populate("participants", PEOPLE_FIELDS)
      .populate("messages.author", PEOPLE_FIELDS);
  }

  res.json({
    conversation: summarizeConversation(conversation.toObject(), req.user._id),
    messages: conversation.messages || [],
  });
});

const listMessages = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "Conversation not found");
  }

  const conversation = await StaffConversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
  }).populate("messages.author", PEOPLE_FIELDS);

  if (!conversation) {
    fail(res, 404, "Conversation not found");
  }

  res.json({ messages: conversation.messages || [] });
});

const createMessage = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "Conversation not found");
  }

  const conversation = await StaffConversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
  });

  if (!conversation) {
    fail(res, 404, "Conversation not found");
  }

  const body = String(req.body.body || req.body.text || "").trim();
  if (!body) {
    fail(res, 400, "Message cannot be empty");
  }

  const replyTo = readReplyTo(req.body.replyTo);
  conversation.messages.push({
    author: req.user._id,
    body,
    ...(replyTo ? { replyTo } : {}),
  });
  if (conversation.messages.length > 200) {
    conversation.messages = conversation.messages.slice(-200);
  }
  await conversation.save();

  const populated = await StaffConversation.findById(conversation._id)
    .populate("messages.author", PEOPLE_FIELDS)
    .populate("participants", PEOPLE_FIELDS)
    .lean();

  const latest = populated.messages[populated.messages.length - 1];
  const recipientIds = populated.participants.map((person) => String(person._id || person));

  emitToUsers(recipientIds, "staff:dm", {
    conversationId: String(conversation._id),
    message: latest,
  });

  res.status(201).json({
    message: "Message sent",
    chatMessage: latest,
    conversation: summarizeConversation(populated, req.user._id),
  });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;
  const messageId = req.params.messageId;

  if (
    !mongoose.Types.ObjectId.isValid(conversationId) ||
    !mongoose.Types.ObjectId.isValid(messageId)
  ) {
    fail(res, 404, "Message not found");
  }

  const conversation = await StaffConversation.findOne({
    _id: conversationId,
    participants: req.user._id,
  });

  if (!conversation) {
    fail(res, 404, "Conversation not found");
  }

  const message = conversation.messages.id(messageId);
  if (!message) {
    fail(res, 404, "Message not found");
  }

  if (String(message.author) !== String(req.user._id)) {
    fail(res, 403, "You can only delete your own messages");
  }

  if (message.deletedAt) {
    fail(res, 400, "This message is already deleted");
  }

  message.deletedAt = new Date();
  message.deletedKind = "text";
  message.body = "This has been deleted";
  message.replyTo = undefined;
  await conversation.save();

  const populated = await StaffConversation.findById(conversation._id)
    .populate("messages.author", PEOPLE_FIELDS)
    .populate("participants", PEOPLE_FIELDS)
    .lean();

  const last = latestMessage(populated.messages);
  const updated = (populated.messages || []).find(
    (item) => String(item._id) === String(messageId)
  );
  const recipientIds = populated.participants.map((person) => String(person._id || person));

  emitToUsers(recipientIds, "staff:dm-removed", {
    conversationId: String(conversation._id),
    messageId: String(messageId),
    message: updated,
    lastMessage: last
      ? {
          body: visibleBody(last),
          createdAt: last.createdAt,
          author: last.author,
        }
      : null,
    updatedAt: populated.updatedAt,
  });

  res.json({
    message: "Message deleted",
    chatMessage: updated,
    conversation: summarizeConversation(populated, req.user._id),
  });
});

module.exports = {
  createMessage,
  deleteMessage,
  listConversations,
  listMessages,
  openConversation,
};
