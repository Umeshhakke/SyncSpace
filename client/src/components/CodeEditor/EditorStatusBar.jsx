import React from "react";
import "./codeEditor.css";

/**
 * ============================================
 * EditorStatusBar - Bottom Status Bar
 * ============================================
 * Displays editor status information:
 * - Language
 * - Theme
 * - Yjs connection status
 * - Cursor position
 * - Line count
 * - Character count
 * - Sync status
 */
const EditorStatusBar = ({
  language = "javascript",
  theme = "vs-dark",
  isBound = false,
  isInitialized = false,
  cursorPosition = { line: 1, column: 1 },
  lineCount = 0,
  characterCount = 0,
  isConnected = false,
  connectionStatus = "local",
}) => {
  // Get Yjs connection status
  const getYjsStatus = () => {
    if (isConnected) return "connected";
    if (isBound) return "synced";
    if (isInitialized) return "ready";
    return "initializing";
  };

  const yjsStatus = getYjsStatus();

  const statusLabels = {
    connected: { label: "🟢 Connected", className: "status-connected" },
    synced: { label: "🔄 Synced", className: "status-synced" },
    ready: { label: "🟡 Ready", className: "status-ready" },
    initializing: { label: "🔴 Initializing", className: "status-loading" },
  };

  const statusInfo = statusLabels[yjsStatus] || statusLabels.initializing;

  return (
    <div className="editor-status-bar">
      {/* Left: Language & Theme */}
      <div className="status-left">
        <span className="status-item">
          <span className="status-label">Language:</span>
          <span className="status-value">{language}</span>
        </span>
        <span className="status-divider">|</span>
        <span className="status-item">
          <span className="status-label">Theme:</span>
          <span className="status-value">{theme}</span>
        </span>
      </div>

      {/* Center: Connection Status */}
      <div className="status-center">
        <span className={`status-item ${statusInfo.className}`}>
          <span className="status-label">Yjs:</span>
          <span className="status-value">{statusInfo.label}</span>
        </span>
        <span className="status-divider">|</span>
        <span className="status-item">
          <span className="status-label">Connection:</span>
          <span className="status-value">
            {connectionStatus === "local" ? "📍 Local" : "🌐 Remote"}
          </span>
        </span>
      </div>

      {/* Right: Position & Stats */}
      <div className="status-right">
        <span className="status-item">
          <span className="status-label">Ln:</span>
          <span className="status-value">{cursorPosition.line}</span>
        </span>
        <span className="status-item">
          <span className="status-label">Col:</span>
          <span className="status-value">{cursorPosition.column}</span>
        </span>
        <span className="status-divider">|</span>
        <span className="status-item">
          <span className="status-label">Lines:</span>
          <span className="status-value">{lineCount}</span>
        </span>
        <span className="status-item">
          <span className="status-label">Chars:</span>
          <span className="status-value">{characterCount}</span>
        </span>
        <span className="status-divider">|</span>
        <span className="status-item status-version">
          <span className="status-label">v</span>
          <span className="status-value">{isBound ? "1.0" : "0.0"}</span>
        </span>
      </div>
    </div>
  );
};

export default EditorStatusBar;
