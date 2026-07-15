import React, { useState, useEffect } from "react";

/**
 * RoomPanel Component
 * Handles entering room credentials, displaying connection status, room entry/exit actions, and tracking room users.
 * 
 * @param {Object} props
 * @param {string} props.connectionStatus - The current connection status ('disconnected' | 'connecting' | 'connected')
 * @param {boolean} props.isJoined - True if the user has successfully joined a room
 * @param {string} props.currentRoomId - The ID of the currently joined room
 * @param {string} props.currentUsername - The username currently joined with
 * @param {Array} props.users - Array of active users ({ socketId, username }) in the room
 * @param {string} props.currentSocketId - The socket ID of the local client
 * @param {Function} props.onJoin - Callback function triggered on Join action
 * @param {Function} props.onLeave - Callback function triggered on Leave action
 */
const RoomPanel = ({
  connectionStatus,
  isJoined,
  currentRoomId,
  currentUsername,
  users = [],
  currentSocketId,
  onJoin,
  onLeave,
}) => {
  const [usernameInput, setUsernameInput] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [validationError, setValidationError] = useState("");

  // Clear inputs when leaving the room
  useEffect(() => {
    if (!isJoined) {
      setUsernameInput("");
      setRoomIdInput("");
    }
  }, [isJoined]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    const trimmedUsername = usernameInput.trim();
    const trimmedRoomId = roomIdInput.trim();

    // Validate inputs
    if (!trimmedUsername || !trimmedRoomId) {
      setValidationError("Username and Room ID are required.");
      return;
    }

    onJoin(trimmedRoomId, trimmedUsername);
  };

  const handleLeaveClick = () => {
    onLeave();
  };

  // Helper to generate deterministic avatar background colors based on username
  const getAvatarColor = (name) => {
    const colors = ["#1976d2", "#388e3c", "#f57c00", "#7b1fa2", "#d32f2f", "#0097a7", "#e91e63", "#00acc1"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Get CSS class and label based on connection status
  const getStatusDetails = () => {
    switch (connectionStatus) {
      case "connected":
        return { className: "status-connected", label: "Connected" };
      case "connecting":
        return { className: "status-connecting", label: "Connecting..." };
      case "disconnected":
      default:
        return { className: "status-disconnected", label: "Disconnected" };
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <div className="room-panel">
      <div className="room-panel-header">
        <h3>SyncSpace Rooms</h3>
        <div className={`status-badge ${statusDetails.className}`}>
          <span className="status-dot"></span>
          {statusDetails.label}
        </div>
      </div>

      {validationError && (
        <div className="room-validation-error">
          ⚠️ {validationError}
        </div>
      )}

      {!isJoined ? (
        <form onSubmit={handleSubmit} className="room-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="e.g. Alice"
              disabled={connectionStatus === "connecting"}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <input
              type="text"
              id="roomId"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="e.g. room-abc"
              disabled={connectionStatus === "connecting"}
              maxLength={30}
            />
          </div>

          <button
            type="submit"
            className="join-btn"
            disabled={connectionStatus === "connecting"}
          >
            {connectionStatus === "connecting" ? "Connecting..." : "Join Room"}
          </button>
        </form>
      ) : (
        <div className="room-details">
          <div className="detail-row">
            <span className="detail-label">Active Room:</span>
            <span className="detail-value room-id-value">{currentRoomId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Username:</span>
            <span className="detail-value">{currentUsername}</span>
          </div>

          <div className="users-list-section">
            <h4>Active Users ({users.length})</h4>
            <div className="users-list">
              {users.map((user) => {
                const isMe = user.socketId === currentSocketId;
                return (
                  <div key={user.socketId} className="user-item">
                    <div
                      className="user-avatar"
                      style={{ backgroundColor: getAvatarColor(user.username) }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="user-name">
                      {user.username} {isMe && <span className="me-badge">(You)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleLeaveClick}
            className="leave-btn"
            disabled={connectionStatus !== "connected"}
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomPanel;
