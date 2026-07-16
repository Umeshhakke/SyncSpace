const Y = require("yjs");

const docMap = new Map();

function getDocument(roomId) {
    if (!docMap.has(roomId)) {
        docMap.set(roomId, new Y.Doc());
        console.log(`Created Yjs document for room: ${roomId}`);
    }

    return docMap.get(roomId);
}

module.exports = {
    getDocument,
    docMap
};