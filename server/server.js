require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
    res.json({
        status: "Server is running"
    });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});
const activeUsers = new Map();
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (token === "demo123") {
        next();
    } else {
        next(new Error("Authentication failed"));
    }
});

// Socket connection
io.on("connection", (socket) => {

    activeUsers.set(socket.id, {
        connectedAt: new Date()
    });

    console.log("User connected:", socket.id);
    console.log("Active Users:", activeUsers.size);

    socket.on("disconnect", () => {
        activeUsers.delete(socket.id);

        console.log("User disconnected:", socket.id);
        console.log("Active Users:", activeUsers.size);
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});