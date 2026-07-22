// server/yjs/documentManager.js - Manages Yjs documents per room

const Y = require('yjs');
const YjsDocument = require('../models/YjsDocument');
const { saveDocumentToDB } = require('./persistence');

// docMap: Maps roomId -> Yjs Document instance
const docMap = new Map();

// Get or create a Yjs document for a room
const getDocument = (roomId) => {
  if (!docMap.has(roomId)) {
    const doc = new Y.Doc();
    docMap.set(roomId, doc);
    console.log(` Yjs document created for room: ${roomId}`);
  }
  return docMap.get(roomId);
};

// Delete a Yjs document (when room becomes empty)
const deleteDocument = (roomId) => {
  if (docMap.has(roomId)) {
    const doc = docMap.get(roomId);
    doc.destroy(); // Clean up the document
    docMap.delete(roomId);
    console.log(` Yjs document deleted for room: ${roomId}`);
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

const loadDocumentFromDB = async (roomId) => {
  try {
    const record = await YjsDocument.findOne({ roomId });
    if (!record) return null;

    const doc = new Y.Doc();
    // Apply the binary state
    Y.applyUpdate(doc, record.yjsState);
    // Store in memory
    docMap.set(roomId, doc);
    console.log(` Loaded document for room ${roomId} from DB`);
    return doc;
  } catch (error) {
    console.error(` Failed to load document for room ${roomId}:`, error);
    return null;
  }
};

/**
 * Restore all Yjs documents from MongoDB into memory.
 * Should be called once on server startup.
 */
const restoreAllDocuments = async () => {
  try {
    const records = await YjsDocument.find({});
    console.log(` Restoring ${records.length} documents from DB...`);
    for (const record of records) {
      const doc = new Y.Doc();
      Y.applyUpdate(doc, record.yjsState);
      docMap.set(record.roomId, doc);
    }
    console.log(` Restored ${records.length} documents.`);
  } catch (error) {
    console.error(' Failed to restore documents:', error);
  }
};

// Export the new functions
module.exports = {
  getDocument,
  deleteDocument,
  documentExists,
  getAllRoomIds,
  docMap,
  loadDocumentFromDB,
  restoreAllDocuments,
};