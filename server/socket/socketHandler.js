// socket/socketHandler.js
const { Server } = require("socket.io");
const roomManager = require("./roomManager");
const { registerRoomEvents } = require("./roomHandlers");

/**
 * Initializes Socket.io on the provided HTTP server.
 * @param {import("http").Server} httpServer
 */
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // In production, restrict to your frontend URL
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ============ Hardcoded authentication ============
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token === "demo123") {
      next();
    } else {
      next(new Error("Authentication failed"));
    }
  });

  // ============ Connection handler ============
  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Register all room events (including disconnect cleanup) from roomHandlers
    registerRoomEvents(io, socket, roomManager);
  });

  return io; // (optional – if you need the io instance elsewhere)
};

module.exports = { initSocket };