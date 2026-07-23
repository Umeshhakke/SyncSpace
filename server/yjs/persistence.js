const { getAllDocs } = require("./documentManager");
const { saveDocumentToDB } = require("./db");

/**
 * Saves every active Yjs document to MongoDB.
 */
async function persistAllDocuments() {
  const docs = getAllDocs();

  for (const [roomId, yDoc] of docs.entries()) {
    await saveDocumentToDB(roomId, yDoc);
  }
}

/**
 * Starts automatic persistence every 5 seconds.
 */
function startPersistenceScheduler() {
  console.log("💾 Persistence scheduler started (every 5 seconds)");

  setInterval(async () => {
    try {
      await persistAllDocuments();
    } catch (err) {
      console.error("Persistence Scheduler Error:", err);
    }
  }, 5000);
}

module.exports = {
  persistAllDocuments,
  startPersistenceScheduler,
};