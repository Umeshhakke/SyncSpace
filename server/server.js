// server.js - Unified Server (Socket.io + Yjs on same port)

const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");
const { initSocket } = require("./socket/socketHandler");
const { getDocument, restoreAllDocuments } = require("./yjs/documentManager"); // 👈 ADDED restoreAllDocuments
const {
  startPersistenceScheduler,
  persistAllDocuments,
} = require("./yjs/persistence");
const connectDB = require("./config/db"); // 👈 ADDED (your DB connection)

dotenv.config();

// ============ Connect to MongoDB first ============
connectDB()
  .then(async () => {
    console.log("✅ MongoDB connected");

    // ============ Restore all Yjs documents from DB ============
    await restoreAllDocuments();

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
    initSocket(httpServer);

    // ============ Attach Yjs WebSocket ============
    const yjsWss = new WebSocket.Server({ noServer: true });

    httpServer.on("upgrade", (req, socket, head) => {
      // Route 1: Socket.io requests (already handled)
      if (req.url.startsWith("/socket.io/")) {
        return;
      }

      // Route 2: Yjs requests (everything else)
      console.log(`🔌 Yjs WebSocket upgrade for: ${req.url}`);
      const roomId = req.url.split("?")[0].replace("/", "");
      console.log(`📄 Yjs Room ID: ${roomId}`);

      // Ensure the Yjs document exists (create if not)
      getDocument(roomId);

      yjsWss.handleUpgrade(req, socket, head, (conn) => {
        setupWSConnection(conn, req);
      });
    });

    // ============ Start the server ============
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.io: ws://localhost:${PORT}/socket.io/`);
      console.log(`🔄 Yjs WebSocket: ws://localhost:${PORT}/:roomId`);
      console.log(`🔐 Auth token: demo123`);
      startPersistenceScheduler();
    });

    // ============ Graceful shutdown ============
    process.on("SIGINT", async () => {
      console.log("\n💾 Saving all Yjs documents before shutdown...");
      try {
        await persistAllDocuments();
        console.log("✅ All documents saved.");
      } catch (err) {
        console.error("❌ Failed to save documents:", err);
      }
      process.exit(0);
    });
  })
  .catch((err) => {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  });