import React from "react";

/**
 * ParticipantsPanel Component
 * Displays real-time presence, online status, language, and typing indicator for editor participants.
 */
const ParticipantsPanel = ({ participants = [], isDarkMode = true }) => {
  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <div className="participants-panel" style={styles.container}>
      <div className="participants-header" style={styles.header}>
        <span style={styles.title}>
          👥 Active Editors ({participants.length})
        </span>
      </div>
      <div className="participants-list" style={styles.list}>
        {participants.map((p) => {
          const initials = p.username
            ? p.username.substring(0, 2).toUpperCase()
            : "?";

          return (
            <div key={p.id} className="participant-card" style={styles.card}>
              {/* Colored Avatar with Online Badge Indicator */}
              <div style={{ position: "relative" }}>
                <div
                  className="participant-avatar"
                  style={{
                    ...styles.avatar,
                    backgroundColor: p.color || "#3f51b5",
                  }}
                >
                  {initials}
                </div>
                {/* Online Status Badge */}
                <div style={styles.onlineBadge} title="Online" />
              </div>

              {/* User Metadata: Username & Language Tag */}
              <div style={styles.info}>
                <div style={styles.nameRow}>
                  <span style={styles.username}>
                    {p.username || "Anonymous"}
                    {p.isLocal && <span style={styles.youTag}> (You)</span>}
                  </span>
                  {p.language && (
                    <span style={styles.languageBadge}>
                      {p.language}
                    </span>
                  )}
                </div>

                {/* Real-time Typing Status Indicator */}
                {p.typing && (
                  <div style={styles.typingIndicator}>
                    <span style={styles.typingDot}>✍️</span> Typing...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Dark Mode Theme Styles
const darkStyles = {
  container: {
    padding: "8px 16px",
    backgroundColor: "#252526",
    borderBottom: "1px solid #3c3c3c",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flexShrink: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#cccccc",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#2d2d2d",
    border: "1px solid #3c3c3c",
    borderRadius: "16px",
    padding: "4px 10px 4px 4px",
    transition: "all 0.2s ease-in-out",
  },
  avatar: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  onlineBadge: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
    width: "8px",
    height: "8px",
    backgroundColor: "#4caf50",
    borderRadius: "50%",
    border: "1.5px solid #2d2d2d",
  },
  info: {
    display: "flex",
    flexDirection: "column",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  username: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#ffffff",
  },
  youTag: {
    fontSize: "11px",
    color: "#888888",
    fontStyle: "italic",
  },
  languageBadge: {
    fontSize: "10px",
    backgroundColor: "#3c3c3c",
    color: "#00bcd4",
    padding: "1px 6px",
    borderRadius: "8px",
    fontWeight: "600",
    textTransform: "lowercase",
  },
  typingIndicator: {
    fontSize: "10px",
    color: "#ff9800",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    marginTop: "1px",
    animation: "pulse 1.5s infinite",
  },
  typingDot: {
    fontSize: "10px",
  },
};

// Light Mode Theme Styles
const lightStyles = {
  container: {
    padding: "8px 16px",
    backgroundColor: "#f3f3f3",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flexShrink: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#555555",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "16px",
    padding: "4px 10px 4px 4px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  avatar: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold",
  },
  onlineBadge: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
    width: "8px",
    height: "8px",
    backgroundColor: "#4caf50",
    borderRadius: "50%",
    border: "1.5px solid #ffffff",
  },
  info: {
    display: "flex",
    flexDirection: "column",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  username: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#333333",
  },
  youTag: {
    fontSize: "11px",
    color: "#777777",
    fontStyle: "italic",
  },
  languageBadge: {
    fontSize: "10px",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    padding: "1px 6px",
    borderRadius: "8px",
    fontWeight: "600",
    textTransform: "lowercase",
  },
  typingIndicator: {
    fontSize: "10px",
    color: "#ed6c02",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    marginTop: "1px",
  },
  typingDot: {
    fontSize: "10px",
  },
};

export default ParticipantsPanel;
