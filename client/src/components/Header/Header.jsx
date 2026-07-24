import React, { useState } from "react";
import "../../styles/header.css";

const Header = () => {
  const [roomId] = useState("ABC123");
  const [username] = useState("Laxman");
  const [isInRoom, setIsInRoom] = useState(false);

  const handleJoinRoom = () => {
    console.log("🚪 Join Room Clicked");
    console.log("📝 Room ID:", roomId);
    console.log("👤 Username:", username);
    setIsInRoom(true);
    console.log("✅ Joined room successfully!");
  };

  const handleLeaveRoom = () => {
    console.log("🚪 Leaving Room:", roomId);
    if (window.confirm(`Are you sure you want to leave room ${roomId}?`)) {
      console.log("✅ Left room successfully");
      setIsInRoom(false);
    }
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    console.log("📋 Room ID copied:", roomId);
    alert("Room ID copied to clipboard!");
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">✏️</span>
          <h2>SyncSpace</h2>
        </div>
      </div>

      <div className="header-center">
        <div className="room-info">
          <span className="room-label">Room:</span>
          <strong
            className="room-id"
            onClick={handleCopyRoomId}
            title="Click to copy"
          >
            {roomId}
            <span className="copy-icon">📋</span>
          </strong>
          <span
            className={`connection-status ${isInRoom ? "online" : "offline"}`}
          >
            {isInRoom ? "● Connected" : "○ Disconnected"}
          </span>
        </div>
      </div>

      <div className="header-right">
        <div className="user-info">
          <span className="user-avatar">👤</span>
          <span className="username">{username}</span>
        </div>

        <div className="header-actions">
          {!isInRoom ? (
            <button className="join-btn" onClick={handleJoinRoom}>
              <span className="join-icon">🔗</span>
              Join Room
            </button>
          ) : (
            <button className="leave-btn" onClick={handleLeaveRoom}>
              <span className="leave-icon">🚪</span>
              Leave Room
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
