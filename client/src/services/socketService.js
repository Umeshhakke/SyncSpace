import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  /**
   * Establishes a Socket.io connection to the backend server.
   * Retrieves the URL from the VITE_API_URL environment variable,
   * falling back to http://localhost:5000 if not defined.
   */
  connect() {
    // If socket is already connected, do not re-initialize
    if (this.socket && this.socket.connected) {
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    // Initialize the socket instance with configurations
    this.socket = io(apiUrl, {
      autoConnect: false, // Disabled auto-connection to only connect on-demand
      withCredentials: true,
    });

    // 1. Connection Error Handling
    this.socket.on("connect_error", (error) => {
      console.error("🔌 Socket Connection Error:", error);
    });

    // 2. Disconnect Handler
    this.socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected. Reason: ${reason}`);
    });

    // 3. Reconnect Handler
    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`🔌 Socket reconnected successfully after ${attemptNumber} attempts.`);
    });

    // 4. Reconnect Attempt Handler
    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔌 Socket attempting to reconnect (attempt #${attemptNumber})...`);
    });

    // Trigger the actual connection
    this.socket.connect();
  }

  /**
   * Gracefully disconnects the active Socket.io connection.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Emits a 'join-room' event with room and user identifier parameters.
   * Automatically establishes connection first and waits for 'connect' event if not connected.
   * @param {string} roomId - The unique identifier of the room to join
   * @param {string} username - The display name of the user joining the room
   */
  joinRoom(roomId, username) {
    if (!this.socket || !this.socket.connected) {
      this.connect();
      this.socket.once("connect", () => {
        this.socket.emit("join-room", { roomId, username });
      });
    } else {
      this.socket.emit("join-room", { roomId, username });
    }
  }

  /**
   * Emits a 'leave-room' event to signify exit from a specific room.
   * @param {string} roomId - The unique identifier of the room to leave
   */
  leaveRoom(roomId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("leave-room", roomId);
    }
  }

  /**
   * Registers a callback listener for a specific socket event.
   * @param {string} event - Name of the event to listen for
   * @param {Function} callback - Callback function execution on event receipt
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Removes callback listeners registered to a specific socket event.
   * @param {string} event - Name of the event to unregister listeners from
   * @param {Function} callback - Specific callback function to unregister
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Export a single instance to serve as a reusable singleton service
const socketService = new SocketService();
export default socketService;
