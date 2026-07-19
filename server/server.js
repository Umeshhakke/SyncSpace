// server.js - Unified Server (Socket.io + Yjs on same port)

const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const WebSocket = require("ws"); // 👈 NEW: For Yjs WebSocket
const { setupWSConnection } = require("y-websocket/bin/utils"); // 👈 NEW: Yjs utility
const { initSocket } = require("./socket/socketHandler");
const { getDocument } = require("./yjs/documentManager");

dotenv.config();

// ============ Create Express app ============
const app = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// ============ Create HTTP server ============
const httpServer = http.createServer(app);

// ============ Initialize Socket.io ============
initSocket(httpServer); // Your existing Socket.io setup (works on /socket.io/)

// ============ 👇 NEW: ATTACH Yjs WebSocket ============
const yjsWss = new WebSocket.Server({ noServer: true });

// Handle WebSocket upgrade requests
httpServer.on("upgrade", (req, socket, head) => {
  // ----- ROUTE 1: Socket.io requests (ignore - already handled) -----
  // Socket.io automatically handles its own /socket.io/ path
  if (req.url.startsWith("/socket.io/")) {
    // Let Socket.io handle its own upgrade (we do nothing here)
    return;
  }

  // ----- ROUTE 2: Yjs requests (everything else) -----
  // Example URLs: /Room-A, /Project-X, /alpha
  console.log(`🔌 Yjs WebSocket upgrade for: ${req.url}`);

  // Extract room ID from URL (remove leading slash and query params)
  const roomId = req.url.split("?")[0].replace("/", "");
  console.log(`📄 Yjs Room ID: ${roomId}`);

  // (Optional) Pre-create the Yjs document using your documentManager
  // This ensures the doc exists before the client connects.
  getDocument(roomId);

  // Hand over to the official Yjs setup function
  yjsWss.handleUpgrade(req, socket, head, (conn) => {
    // Pass the connection to y-websocket's utility
    // It handles the Yjs sync protocol (awareness + document sync)
    setupWSConnection(conn, req);
  });
});
// ============ 👆 END Yjs SETUP ============

// ============ Start the server ============
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.io: ws://localhost:${PORT}/socket.io/`);
  console.log(`🔄 Yjs WebSocket: ws://localhost:${PORT}/:roomId`);
  console.log(`🔐 Auth token: demo123`);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  httpServer.close(() => process.exit(1));
});