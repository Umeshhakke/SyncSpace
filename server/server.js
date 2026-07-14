const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const { initSocket } = require("./socket/socketHandler");

// Load environment variables FIRST
dotenv.config();

// Color helper (no external package needed)
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
};

// Connect to MongoDB with better error handling
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start server
    const PORT = process.env.PORT || 5000;
    const server = http.createServer(app);

    // Initialize Socket.io modular handler
    initSocket(server);

    server.listen(PORT, () => {
      console.log(
        `${colors.green}✅ Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}${colors.reset}`,
      );
      console.log(
        `${colors.cyan}📍 URL: http://localhost:${PORT}${colors.reset}`,
      );
      console.log(
        `${colors.yellow}🔒 Health check: http://localhost:${PORT}/health${colors.reset}`,
      );
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.log(
        `${colors.red}❌ Unhandled Rejection: ${err.message}${colors.reset}`,
      );
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.log(
      `${colors.red}❌ Server startup failed: ${error.message}${colors.reset}`,
    );
    process.exit(1);
  }
};

startServer();

