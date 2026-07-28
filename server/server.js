const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const WebSocket = require("ws");

const { initSocket } = require("./socket/socketHandler");
const { setupWSConnection, docs: yjsDocs } = require("y-websocket/bin/utils");
const {
  getDocument,
  restoreAllDocuments,
  persistAllDocuments,
  startPersistenceScheduler,
} = require("./yjs/documentManager");
const connectDB = require("./config/db");

dotenv.config();

connectDB()
  .then(async () => {
    console.log("✅ MongoDB connected");

    // ============ Restore all Yjs documents from DB into yjsDocs ============
    await restoreAllDocuments();

    console.log(`✅ Total documents in yjsDocs: ${yjsDocs.size}`);

    // ============ Create Express app ============
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Health check
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
      // Skip Socket.io upgrade requests
      if (req.url.startsWith("/socket.io/")) return;

      console.log(`🔌 Yjs WebSocket upgrade for: ${req.url}`);
      const roomId = req.url.slice(1).split("?")[0];
      console.log(`📄 Yjs Room ID: ${roomId}`);

      // Ensure the document exists (creates in yjsDocs)
      getDocument(roomId);

      // Safety: double-check it's in the map
      if (!yjsDocs.has(roomId)) {
        console.warn(`⚠️ Room ${roomId} not in yjsDocs after getDocument – forcing creation.`);
        getDocument(roomId);
      }

      console.log(`📌 yjsDocs has "${roomId}"? ${yjsDocs.has(roomId)}`);
      console.log(`📌 Document object:`, yjsDocs.get(roomId) ? "✅ exists" : "❌ missing");

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

      // Start the persistence scheduler (saves every 5 seconds)
      startPersistenceScheduler();
    });

    // ============ Graceful shutdown ============
    process.on("SIGINT", async () => {
      console.log("\n💾 Saving all Yjs documents before shutdown...");
      await persistAllDocuments();
      console.log("✅ All documents saved.");
      process.exit(0);
    });
  })
  .catch((err) => {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  });