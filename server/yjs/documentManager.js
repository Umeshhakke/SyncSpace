const Y = require("yjs");
const { Awareness } = require("y-protocols/awareness");
const YjsDocument = require("../models/YjsDocument");
const { docs: yjsDocs } = require("y-websocket/bin/utils");
const { saveDocumentToDB } = require("./db");

// ---------- Core document operations ----------
const getDocument = (roomId) => {
  if (!yjsDocs.has(roomId)) {
    const doc = new Y.Doc();

    // 🔥 Required by y-websocket's setupWSConnection
    doc.conns = new Map();
    doc.awareness = new Awareness(doc);

    yjsDocs.set(roomId, doc);
    console.log(`📄 Yjs document created for room: ${roomId}`);
  }
  return yjsDocs.get(roomId);
};

const deleteDocument = (roomId) => {
  if (yjsDocs.has(roomId)) {
    const doc = yjsDocs.get(roomId);
    doc.destroy();
    yjsDocs.delete(roomId);
    console.log(`🗑️ Yjs document deleted for room: ${roomId}`);
  }
};

const documentExists = (roomId) => yjsDocs.has(roomId);
const getAllRoomIds = () => Array.from(yjsDocs.keys());

// ---------- Persistence ----------
const persistAllDocuments = async () => {
  for (const [roomId, doc] of yjsDocs.entries()) {
    await saveDocumentToDB(roomId, doc);
  }
};

const startPersistenceScheduler = () => {
  console.log("💾 Persistence scheduler started (every 5 seconds)");
  setInterval(async () => {
    try {
      await persistAllDocuments();
    } catch (err) {
      console.error("Persistence Scheduler Error:", err);
    }
  }, 5000);
};

const loadDocumentFromDB = async (roomId) => {
  try {
    const record = await YjsDocument.findOne({ roomId });
    if (!record) return null;

    const doc = new Y.Doc();
    doc.conns = new Map();
    doc.awareness = new Awareness(doc);
    Y.applyUpdate(doc, record.yjsState);
    yjsDocs.set(roomId, doc);
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
      console.log("ℹ️ No documents to restore.");
      return;
    }
    console.log(`🔄 Restoring ${records.length} documents from DB...`);
    for (const record of records) {
      const doc = new Y.Doc();
      doc.conns = new Map();
      doc.awareness = new Awareness(doc);
      Y.applyUpdate(doc, record.yjsState);
      yjsDocs.set(record.roomId, doc);
    }
    console.log(`✅ Restored ${records.length} documents.`);
  } catch (error) {
    console.error("❌ Failed to restore documents:", error);
  }
};

module.exports = {
  getDocument,
  deleteDocument,
  documentExists,
  getAllRoomIds,
  persistAllDocuments,
  startPersistenceScheduler,
  loadDocumentFromDB,
  restoreAllDocuments,
};