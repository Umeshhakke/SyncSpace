const http = require("http");
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");

const { getDocument } = require("./documentManager");
const { roomUsers } = require("../socket/roomManager");

const PORT = 1234;

const server = http.createServer();

const wss = new WebSocket.Server({
  server,
});

console.log("Starting Yjs WebSocket Server...");

wss.on("connection", (conn, req) => {
  console.log("====================================");
  console.log("✅ New WebSocket Connection");

  // Example URL:
  // /room-abc?token=xxxx
  console.log("Request URL:", req.url);

  const roomId = req.url.split("?")[0].replace("/", "");

  console.log("Room ID:", roomId);

  // Get/Create the shared Yjs document
  const doc = getDocument(roomId);

  // Get users already present in the room
  const users = roomUsers.get(roomId) || new Map();

  console.log(`Loaded Y.Doc for room "${roomId}"`);
  console.log(`Current users in room: ${users.size}`);

  // Store for debugging/future extensions
  conn.roomId = roomId;
  conn.doc = doc;

  // Hand over to the official Yjs server
  setupWSConnection(conn, req);

  conn.on("close", () => {
    console.log(`❌ WebSocket disconnected from room ${roomId}`);
  });

  console.log("====================================");
});

server.listen(PORT, () => {
  console.log(`🚀 Yjs WebSocket Server running on ws://localhost:${PORT}`);
});