const Y = require('yjs');
const YjsDocument = require('../models/YjsDocument');

// docMap: Maps roomId -> Yjs Document instance
const docMap = new Map();

// ---------- Core document operations ----------
const getDocument = (roomId) => {
  if (!docMap.has(roomId)) {
    const doc = new Y.Doc();
    docMap.set(roomId, doc);
    console.log(`📄 Yjs document created for room: ${roomId}`);
  }
  return docMap.get(roomId);
};

const deleteDocument = (roomId) => {
  if (docMap.has(roomId)) {
    const doc = docMap.get(roomId);
    doc.destroy();
    docMap.delete(roomId);
    console.log(`🗑️ Yjs document deleted for room: ${roomId}`);
  }
};

const documentExists = (roomId) => {
  return docMap.has(roomId);
};

const getAllRoomIds = () => {
  return Array.from(docMap.keys());
};

// ---------- Used by persistence scheduler ----------
const getAllDocs = () => {
  return docMap;
};

// ---------- Persistence (load/restore) ----------
const loadDocumentFromDB = async (roomId) => {
  try {
    const record = await YjsDocument.findOne({ roomId });
    if (!record) return null;

    const doc = new Y.Doc();
    Y.applyUpdate(doc, record.yjsState);
    docMap.set(roomId, doc);
    console.log(`📂 Loaded document for room ${roomId} from DB`);
    return doc;
  } catch (error) {
    console.error(`❌ Failed to load document for room ${roomId}:`, error);
    return null;
  }
};

const restoreAllDocuments = async () => {
  try {
    const records = await YjsDocument.find({});
    if (records.length === 0) {
      console.log('ℹ️ No documents to restore.');
      return;
    }
    console.log(`🔄 Restoring ${records.length} documents from DB...`);
    for (const record of records) {
      const doc = new Y.Doc();
      Y.applyUpdate(doc, record.yjsState);
      docMap.set(record.roomId, doc);
    }
    console.log(`✅ Restored ${records.length} documents.`);
  } catch (error) {
    console.error('❌ Failed to restore documents:', error);
  }
};

module.exports = {
  getDocument,
  deleteDocument,
  documentExists,      // ✅ now defined
  getAllRoomIds,       // ✅ now defined
  getAllDocs,          // ✅ now exported (required by persistence.js)
  docMap,              // (optional, keep for direct access)
  loadDocumentFromDB,
  restoreAllDocuments,
};