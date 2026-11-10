const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const { emitToUsers } = require("../realtime/io");
const asyncHandler = require("../utils/asyncHandler");

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const unreadFilter = (userId) => ({ recipient: userId, readAt: null });

const countUnread = (userId) => Notification.countDocuments(unreadFilter(userId));

const listNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(80)
      .populate("actor", "name avatar")
      .lean(),
    countUnread(req.user._id),
  ]);

  res.json({ notifications, unreadCount });
});

const unreadNotificationCount = asyncHandler(async (req, res) => {
  const unreadCount = await countUnread(req.user._id);
  res.json({ unreadCount });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "Notification not found");
  }

  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    fail(res, 404, "Notification not found");
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  const unreadCount = await countUnread(req.user._id);
  emitToUsers([req.user._id], "notification:read", {
    id: String(notification._id),
    readAt: notification.readAt,
    unreadCount,
  });
  res.json({
    message: "Notification read",
    notification,
    unreadCount,
  });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const readAt = new Date();
  await Notification.updateMany(unreadFilter(req.user._id), {
    $set: { readAt },
  });

  emitToUsers([req.user._id], "notification:read-all", {
    readAt,
    unreadCount: 0,
  });

  res.json({ message: "Notifications read", unreadCount: 0 });
});

module.exports = {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
};
