import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this._currentRoomId = null;
    this._currentUsername = null;
  }

  connect() {
    if (this.socket && this.socket.connected) return;

    const apiUrl =
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000";

    this.socket = io(apiUrl, {
      autoConnect: false,
      auth: {
        token: "demo123",
      },
    });

    this.socket.on("connect_error", (err) =>
      console.error(err)
    );

    this.socket.connect();
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  joinRoom(roomId, username) {
    this._currentRoomId = roomId;
    this._currentUsername = username;

    if (!this.socket || !this.socket.connected) {
      this.connect();

      this.socket.once("connect", () => {
        this.socket.emit("join-room", {
          roomId,
          username,
        });
      });

      return;
    }

    this.socket.emit("join-room", {
      roomId,
      username,
    });
  }

  leaveRoom() {
    this.socket?.emit("leave-room");
  }

  on(event, callback) {
    this.socket?.on(event, callback);
  }

  off(event, callback) {
    this.socket?.off(event, callback);
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }
}

export default new SocketService();