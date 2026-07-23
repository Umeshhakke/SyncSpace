const Y = require("yjs");
const YjsDocument = require("../models/YjsDocument");

/**
 * Save one Yjs document to MongoDB.
 * @param {string} roomId
 * @param {Y.Doc} yDoc
 */
async function saveDocumentToDB(roomId, yDoc) {
  try {
    // Convert the Y.Doc into a binary update
    const binaryState = Buffer.from(Y.encodeStateAsUpdate(yDoc));

    // Update existing document or create a new one
    await YjsDocument.findOneAndUpdate(
      { roomId },
      {
        roomId,
        yjsState: binaryState,
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    console.log(`✅ Saved room "${roomId}" to MongoDB`);
  } catch (err) {
    console.error(`❌ Failed to save room "${roomId}"`, err);
  }
}

module.exports = {
  saveDocumentToDB,
};