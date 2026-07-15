// server.js - Main entry point
const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const { initSocket } = require("./socket/socketHandler"); // NEW import
// At the very top of server.js, add this line:
const { getDocument } = require('./yjs/documentManager');

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

// ============ Initialize Socket.io (moved to socketHandler) ============
initSocket(httpServer); // This handles all socket setup

// ============ Start the server ============
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Socket.io waiting for connections (token: demo123)`);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error(" Unhandled Rejection:", err.message);
  httpServer.close(() => process.exit(1));
});