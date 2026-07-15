// server/socket/roomManager.js - Manages in-memory room data

// roomUsers: Maps roomId -> Map(socketId -> username)
const roomUsers = new Map();

// Add a user to a room
const addUser = (roomId, socketId, username) => {
  if (!roomUsers.has(roomId)) {
    roomUsers.set(roomId, new Map());
  }
  const users = roomUsers.get(roomId);
  users.set(socketId, username);
  return users;
};

// Remove a user from a room
const removeUser = (roomId, socketId) => {
  if (roomUsers.has(roomId)) {
    const users = roomUsers.get(roomId);
    users.delete(socketId);
    // If room is empty, delete it
    if (users.size === 0) {
      roomUsers.delete(roomId);
    }
    return users;
  }
  return null;
};

// Get all participants in a room
const getParticipants = (roomId) => {
  if (roomUsers.has(roomId)) {
    const users = roomUsers.get(roomId);
    return Array.from(users.entries()).map(([socketId, username]) => ({
      userId: socketId,
      username: username,
    }));
  }
  return [];
};

// Get the size of a room
const getRoomSize = (roomId) => {
  if (roomUsers.has(roomId)) {
    return roomUsers.get(roomId).size;
  }
  return 0;
};

module.exports = {
  addUser,
  removeUser,
  getParticipants,
  getRoomSize,
  roomUsers,
};