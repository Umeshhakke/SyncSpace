// server/server.js - Unified Server (Socket.io + Yjs + Auth & Room APIs on same port)
const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");
const { initSocket } = require("./socket/socketHandler");
const { getDocument, restoreAllDocuments } = require("./yjs/documentManager");
const {
  startPersistenceScheduler,
  persistAllDocuments,
} = require("./yjs/persistence");
const connectDB = require("./config/db");

dotenv.config();

// ============ Connect to DB (or use local JSON store fallback) ============
async function bootstrapServer() {
  const isMongoConnected = await connectDB();

  if (isMongoConnected) {
    try {
      await restoreAllDocuments();
    } catch (err) {
      console.warn("⚠️ Could not restore Yjs documents from DB:", err.message);
    }
  }

  // ============ Create Express app ============
  const app = express();
  app.use(cors({ origin: "*" }));
  app.use(express.json());

  // ============ API Routes ============
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/rooms", require("./routes/roomRoutes"));

  // Health check route
  app.get("/health", (req, res) => {
    res.json({
      status: "Server is running",
      mongoConnected: isMongoConnected,
    });
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
    const roomId = req.url.split("?")[0].replace("/", "");
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
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`📁 Room API: http://localhost:${PORT}/api/rooms`);
    console.log(`🔌 Socket.io: ws://localhost:${PORT}/socket.io/`);
    console.log(`🔄 Yjs WebSocket: ws://localhost:${PORT}/:roomId`);
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
}

bootstrapServer().catch((err) => {
  console.error("❌ Fatal error during server startup:", err);
  process.exit(1);
});