// server/server.js - Main entry point with Socket.io

const app = require("./app");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

// Import your room modules
const roomManager = require("./socket/roomManager");
const { registerRoomEvents } = require("./socket/roomHandlers");

// Load environment variables
dotenv.config();

// Color helper (kept from your original code)
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
};

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP server (wraps your Express app)
    const httpServer = http.createServer(app);

    // Attach Socket.io
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
        credentials: true,
        methods: ["GET", "POST"],
      },
    });

    // Socket.io connection handler
    io.on("connection", (socket) => {
      console.log(`${colors.cyan}🔌 New client connected: ${socket.id}${colors.reset}`);

      // Register all room events from your handler file
      registerRoomEvents(io, socket, roomManager);
    });

    // Start the server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(
        `${colors.green}✅ Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}${colors.reset}`
      );
      console.log(
        `${colors.cyan}📍 URL: http://localhost:${PORT}${colors.reset}`
      );
      console.log(
        `${colors.yellow}🔒 Health check: http://localhost:${PORT}/health${colors.reset}`
      );
      console.log(
        `${colors.yellow}🔌 Socket.io is listening for WebSocket connections${colors.reset}`
      );
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.log(
        `${colors.red}❌ Unhandled Rejection: ${err.message}${colors.reset}`
      );
      httpServer.close(() => process.exit(1));
    });
  } catch (error) {
    console.log(
      `${colors.red}❌ Server startup failed: ${error.message}${colors.reset}`
    );
    process.exit(1);
  }
};

startServer();