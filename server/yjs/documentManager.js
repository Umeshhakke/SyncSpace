const Y = require("yjs");

// Stores one Y.Doc per room
const docMap = new Map();

/**
 * Returns an existing Y.Doc or creates a new one.
 */
function getDocument(roomId) {
    if (!docMap.has(roomId)) {
        docMap.set(roomId, new Y.Doc());
        console.log(`Created Yjs document for room: ${roomId}`);
    }

    return docMap.get(roomId);
}

/**
 * Returns all active documents.
 * Used by the persistence scheduler.
 */
function getAllDocs() {
    return docMap;
}

module.exports = {
    getDocument,
    getAllDocs,
    docMap,
};