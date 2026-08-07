// Stores chat history room-wise

const roomChats = new Map();

/**
 * Get chat history
 */
function getChatHistory(roomId) {
  if (!roomChats.has(roomId)) {
    roomChats.set(roomId, []);
  }

  return roomChats.get(roomId);
}

/**
 * Add new message
 */
function addMessage(roomId, message) {
  if (!roomChats.has(roomId)) {
    roomChats.set(roomId, []);
  }

  roomChats.get(roomId).push(message);

  // Keep only last 100 messages
  if (roomChats.get(roomId).length > 100) {
    roomChats.get(roomId).shift();
  }
}

module.exports = {
  getChatHistory,
  addMessage,
};
