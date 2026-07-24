import React, { useState } from "react";
import "../../styles/participants.css";

const ParticipantSidebar = () => {
  // Placeholder - will come from backend later
  const [participants] = useState([]);
  const [isInRoom] = useState(false);

  // Mock participants for testing UI
  const mockParticipants = [
    { id: 1, name: "Laxman", isOnline: true, isCurrentUser: true },
    { id: 2, name: "Priya", isOnline: true, isCurrentUser: false },
    { id: 3, name: "Raj", isOnline: false, isCurrentUser: false },
  ];

  // Use mock data if no real participants
  const displayParticipants =
    participants.length > 0 ? participants : mockParticipants;

  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const getColor = (name) => {
    const colors = [
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#ef4444",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="participant-sidebar">
      <div className="participant-header">
        <h3>👥 Participants</h3>
        <span className="participant-count">{displayParticipants.length}</span>
      </div>

      <div className="participant-list">
        {displayParticipants.length === 0 ? (
          <div className="participant-empty">
            <span className="empty-icon">👤</span>
            <p>No users connected</p>
            <span className="empty-sub">Waiting for participants...</span>
          </div>
        ) : (
          displayParticipants.map((participant) => (
            <div
              key={participant.id}
              className={`participant-card ${participant.isCurrentUser ? "current-user" : ""}`}
            >
              <div
                className="participant-avatar"
                style={{ backgroundColor: getColor(participant.name) }}
              >
                {getInitials(participant.name)}
              </div>
              <div className="participant-info">
                <span className="participant-name">
                  {participant.name}
                  {participant.isCurrentUser && (
                    <span className="current-user-badge">(You)</span>
                  )}
                </span>
                <span
                  className={`participant-status ${participant.isOnline ? "online" : "offline"}`}
                >
                  {participant.isOnline ? "● Online" : "○ Offline"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Room Info Footer */}
      <div className="participant-footer">
        <div className="room-share">
          <span>📋 Share room ID with others</span>
        </div>
      </div>
    </div>
  );
};

export default ParticipantSidebar;
