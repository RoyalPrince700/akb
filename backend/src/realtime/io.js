const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const User = require("../models/User");

let io = null;

const userRoom = (userId) => `user:${String(userId)}`;

const initSocket = (httpServer) => {
  const origin = process.env.CLIENT_URL || "http://localhost:5173";

  io = new Server(httpServer, {
    cors: {
      origin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = String(socket.handshake.auth?.token || "").trim();
      if (!token) {
        next(new Error("Authentication token is required"));
        return;
      }

      const secret = process.env.JWT_SECRET || "development-secret-change-me";
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.userId).select("_id");

      if (!user) {
        next(new Error("Authenticated user no longer exists"));
        return;
      }

      socket.userId = String(user._id);
      next();
    } catch (error) {
      next(new Error("Authentication token is required"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.userId));
  });

  return io;
};

const emitToUsers = (userIds, event, payload) => {
  if (!io) {
    return;
  }

  const ids = [
    ...new Set((userIds || []).map((id) => String(id?._id || id || "")).filter(Boolean)),
  ];

  ids.forEach((id) => {
    io.to(userRoom(id)).emit(event, payload);
  });
};

module.exports = {
  emitToUsers,
  initSocket,
};
