const { Server } = require("socket.io");

// Room Manager using a Map to maintain room memberships.
// Structure: RoomID (string) -> Map of SocketID (string) -> Username (string)
const roomManager = new Map();

/**
 * Initializes Socket.io on the provided HTTP server.
 * @param {import("http").Server} httpServer - Node HTTP server instance
 * @returns {Server} Socket.io Server instance
 */
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Track rooms this specific socket joined during this connection session
    const activeRooms = new Set();

    // Event: Client joins a room
    socket.on("join-room", ({ roomId, username }) => {
      if (!roomId || !username) {
        console.warn(`⚠️ [join-room] Missing parameters from socket ${socket.id}: roomId=${roomId}, username=${username}`);
        return;
      }

      // Join the standard Socket.io room channel
      socket.join(roomId);
      activeRooms.add(roomId);

      // Initialize room user map if it doesn't exist
      if (!roomManager.has(roomId)) {
        roomManager.set(roomId, new Map());
      }
      
      // Store the user under their socket.id in the room's user map
      roomManager.get(roomId).set(socket.id, username);

      console.log(`👤 User "${username}" (${socket.id}) joined room: ${roomId}`);

      // Compile and emit updated user list to all participants in this room
      const usersInRoom = Array.from(roomManager.get(roomId).entries()).map(([id, name]) => ({
        socketId: id,
        username: name,
      }));
      
      io.to(roomId).emit("room-users-updated", usersInRoom);
    });

    // Event: Client explicitly leaves a room
    socket.on("leave-room", (roomId) => {
      if (!roomId) return;

      console.log(`👤 User with socket ${socket.id} left room: ${roomId}`);

      // Leave the standard Socket.io room channel
      socket.leave(roomId);
      activeRooms.delete(roomId);

      // Remove the user registration from our room manager
      if (roomManager.has(roomId)) {
        const roomUsers = roomManager.get(roomId);
        roomUsers.delete(socket.id);

        // Delete the room entirely if no users remain
        if (roomUsers.size === 0) {
          roomManager.delete(roomId);
        } else {
          // Emit updated user list to remaining users in this room
          const usersInRoom = Array.from(roomUsers.entries()).map(([id, name]) => ({
            socketId: id,
            username: name,
          }));
          io.to(roomId).emit("room-users-updated", usersInRoom);
        }
      }
    });

    // Event: Client disconnects
    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      // Perform cleanup for all rooms this socket joined
      activeRooms.forEach((roomId) => {
        if (roomManager.has(roomId)) {
          const roomUsers = roomManager.get(roomId);
          roomUsers.delete(socket.id);

          if (roomUsers.size === 0) {
            roomManager.delete(roomId);
          } else {
            // Notify remaining users of the updated room user list
            const usersInRoom = Array.from(roomUsers.entries()).map(([id, name]) => ({
              socketId: id,
              username: name,
            }));
            io.to(roomId).emit("room-users-updated", usersInRoom);
          }
        }
      });
      activeRooms.clear();
    });
  });

  return io;
};

module.exports = { initSocket, roomManager };
