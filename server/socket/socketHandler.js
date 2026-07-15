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

    // Register all room events from your existing roomHandlers
    registerRoomEvents(io, socket, roomManager);

    // Optional: add any additional socket events here

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  return io; // (optional – if you need the io instance elsewhere)
};

module.exports = { initSocket };