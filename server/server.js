const app = require("./app");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const { initSocket } = require("./socket/socketHandler");

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

// Connect to MongoDB with better error handling
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
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
