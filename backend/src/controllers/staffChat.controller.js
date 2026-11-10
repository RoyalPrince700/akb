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
          body: last.body,
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

  conversation.messages.push({ author: req.user._id, body });
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

module.exports = {
  createMessage,
  listConversations,
  listMessages,
  openConversation,
};
