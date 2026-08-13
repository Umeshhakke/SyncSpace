// // socket/socketHandler.js
// const { Server } = require("socket.io");
// const roomManager = require("./roomManager");
// const { registerRoomEvents } = require("./roomHandlers");

// /**
//  * Initializes Socket.io on the provided HTTP server.
//  * @param {import("http").Server} httpServer
//  */
// const initSocket = (httpServer) => {
//   const io = new Server(httpServer, {
//     cors: {
//       origin: "*", // In production, restrict to your frontend URL
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   // ============ Hardcoded authentication ============
//   io.use((socket, next) => {
//     const token = socket.handshake.auth.token;
//     if (token === "demo123") {
//       next();
//     } else {
//       next(new Error("Authentication failed"));
//     }
//   });

//   // ============ Connection handler ============
//   io.on("connection", (socket) => {
//     console.log(`🔌 New client connected: ${socket.id}`);

//     // Register all room events (including disconnect cleanup) from roomHandlers
//     registerRoomEvents(io, socket, roomManager);
//   });

//   return io; // (optional – if you need the io instance elsewhere)
// };

// module.exports = { initSocket };

// server/socket/socketHandler.js
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

    // ---- Existing room events (join, leave, disconnect) ----
    registerRoomEvents(io, socket, roomManager);

    // ================================================================
    // ============ NEW: Voice chat signaling events ===================
    // ================================================================

    // 1. User turns on microphone
    socket.on("voice:mic-on", ({ roomId }) => {
      const username = socket.data.username || "Anonymous";
      // Broadcast to everyone else in the room
      socket.to(roomId).emit("voice:user-mic-on", {
        clientId: socket.id,
        username: username,
      });
    });

    // 2. User turns off microphone
    socket.on("voice:mic-off", ({ roomId }) => {
      socket.to(roomId).emit("voice:user-mic-off", {
        clientId: socket.id,
      });
    });

    // 3. Forward WebRTC offer to a specific peer
    socket.on("voice:offer", ({ roomId, to, offer }) => {
      socket.to(to).emit("voice:offer", {
        from: socket.id,
        offer,
      });
    });

    // 4. Forward WebRTC answer to a specific peer
    socket.on("voice:answer", ({ roomId, to, answer }) => {
      socket.to(to).emit("voice:answer", {
        from: socket.id,
        answer,
      });
    });

    // 5. Forward ICE candidate to a specific peer
    socket.on("voice:ice-candidate", ({ roomId, target, candidate }) => {
      socket.to(target).emit("voice:ice-candidate", {
        from: socket.id,
        candidate,
      });
    });

    // ================================================================
    // ============ END of voice events ================================
    // ================================================================

    // The disconnect event is already handled inside roomHandlers.js,
    // so we don't need to add it here again.
  });

  return io;
};

module.exports = { initSocket };