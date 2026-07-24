// server/socket/roomHandlers.js
const documentManager = require('../yjs/documentManager');
const { saveDocumentToDB } = require('../yjs/db');   // 👈 import from db.js

const registerRoomEvents = (io, socket, roomManager) => {
  // ---------- JOIN ROOM (async) ----------
  socket.on("join-room", async ({ roomId, username }) => {
    if (!roomId || !username) {
      socket.emit("error", { message: "Room ID and Username are required." });
      return;
    }

    roomId = roomId.trim();
    username = username.trim();

    socket.data.username = username;
    socket.data.roomId = roomId;

    socket.join(roomId);
    console.log(`📝 ${username} (${socket.id}) joined room: ${roomId}`);

    roomManager.addUser(roomId, socket.id, username);

    // ---------- Load or create Yjs document ----------
    let doc = documentManager.getDocument(roomId);      // check memory
    if (!doc) {
      doc = await documentManager.loadDocumentFromDB(roomId);
    }
    if (!doc) {
      doc = documentManager.getDocument(roomId);        // create new
    }

    socket.broadcast.to(roomId).emit("user-joined", {
      userId: socket.id,
      username: username,
      message: `${username} has joined the room.`,
    });

    const participants = roomManager.getParticipants(roomId);
    socket.emit("room:participants", {
      roomId: roomId,
      participants: participants,
    });

    console.log(`👥 Room "${roomId}" now has ${participants.length} participants.`);
  });

  // ---------- LEAVE ROOM (async) ----------
  socket.on("leave-room", async () => {
    const roomId = socket.data.roomId;
    const username = socket.data.username;

    if (!roomId) {
      socket.emit("error", { message: "You are not in a room." });
      return;
    }

    socket.leave(roomId);
    roomManager.removeUser(roomId, socket.id);

    const remainingUsers = roomManager.getRoomSize(roomId);
    if (remainingUsers === 0) {
      // Save final state before deletion
      const doc = documentManager.getDocument(roomId);
      if (doc) {
        await saveDocumentToDB(roomId, doc);
      }
      documentManager.deleteDocument(roomId);
    }

    socket.broadcast.to(roomId).emit("user-left", {
      userId: socket.id,
      username: username,
      message: `${username} has left the room.`,
    });

    socket.data.roomId = null;
    socket.data.username = null;

    console.log(`🚪 ${username} (${socket.id}) left room ${roomId}`);
    socket.emit("left-room", { roomId, message: "You have left the room." });
  });

  // ---------- DISCONNECT (async) ----------
  socket.on("disconnect", async () => {
    const roomId = socket.data.roomId;
    const username = socket.data.username;

    if (roomId && username) {
      console.log(`⚠️ ${username} (${socket.id}) disconnected unexpectedly. Cleaning up...`);
      roomManager.removeUser(roomId, socket.id);

      const remainingUsers = roomManager.getRoomSize(roomId);
      if (remainingUsers === 0) {
        const doc = documentManager.getDocument(roomId);
        if (doc) {
          await saveDocumentToDB(roomId, doc);
        }
        documentManager.deleteDocument(roomId);
      }

      socket.broadcast.to(roomId).emit("user-left", {
        userId: socket.id,
        username: username,
        message: `${username} disconnected.`,
      });
      socket.data.roomId = null;
      socket.data.username = null;
    }

    console.log(`❌ Socket ${socket.id} fully disconnected.`);
  });
};

module.exports = { registerRoomEvents };