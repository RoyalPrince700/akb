import { io } from "socket.io-client";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const socketUrl = apiBase.replace(/\/api\/?$/, "");

let socket = null;
let activeToken = "";

export const connectRealtime = (token) => {
  const nextToken = String(token || "").trim();
  if (!nextToken) {
    return null;
  }

  if (socket && activeToken === nextToken) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  activeToken = nextToken;
  socket = io(socketUrl, {
    auth: { token: nextToken },
    autoConnect: true,
    transports: ["websocket", "polling"],
  });

  return socket;
};

export const disconnectRealtime = () => {
  activeToken = "";
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getRealtimeSocket = () => socket;
