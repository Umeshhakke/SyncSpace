// server.js - Main entry point (standalone, no DB)

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

// Import your room modules (if they exist)
// If you don't have these files yet, comment out or remove these lines.
const roomManager = require("./socket/roomManager");
const { registerRoomEvents } = require("./socket/roomHandlers");

// Load environment variables (optional)
dotenv.config();

// ============ Create Express app ============
const app = express();
app.use(cors());
app.use(express.json());

// Health check route (kept from your first version)
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// ============ Create HTTP server ============
const httpServer = http.createServer(app);

// ============ Attach Socket.io ============
const io = new Server(httpServer, {
  cors: {
    origin: "*", // For development; restrict later
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ============ Hardcoded authentication middleware ============
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === "demo123") {
    next(); // Accept connection
  } else {
    next(new Error("Authentication failed")); // Reject
  }
});

// ============ Socket connection handler ============
io.on("connection", (socket) => {
  console.log(` New client connected: ${socket.id}`);

  // Register all room events (if you have the files)
  if (typeof registerRoomEvents === "function") {
    registerRoomEvents(io, socket, roomManager);
  } else {
    // Fallback: basic events if room modules are missing
    console.log("  Room handlers not loaded – using fallback.");
    socket.on("message", (data) => {
      console.log("Message received:", data);
      socket.emit("message", "Echo: " + data);
    });
  }

  socket.on("disconnect", () => {
    console.log(` User disconnected: ${socket.id}`);
  });
});

// ============ Start the server ============
const PORT = process.env.PORT || 3000;
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