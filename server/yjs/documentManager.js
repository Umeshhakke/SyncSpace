// server/yjs/documentManager.js - Manages Yjs documents per room

const Y = require('yjs');

// docMap: Maps roomId -> Yjs Document instance
const docMap = new Map();

// Get or create a Yjs document for a room
const getDocument = (roomId) => {
  if (!docMap.has(roomId)) {
    const doc = new Y.Doc();
    docMap.set(roomId, doc);
    console.log(`📄 Yjs document created for room: ${roomId}`);
  }
  return docMap.get(roomId);
};

// Delete a Yjs document (when room becomes empty)
const deleteDocument = (roomId) => {
  if (docMap.has(roomId)) {
    const doc = docMap.get(roomId);
    doc.destroy(); // Clean up the document
    docMap.delete(roomId);
    console.log(`🗑️ Yjs document deleted for room: ${roomId}`);
  }
};

// Check if a document exists for a room
const documentExists = (roomId) => {
  return docMap.has(roomId);
};

// Get all active room IDs (for debugging)
const getAllRoomIds = () => {
  return Array.from(docMap.keys());
};

module.exports = {
  getDocument,
  deleteDocument,
  documentExists,
  getAllRoomIds,
  docMap,
};