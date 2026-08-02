import React, { useState } from "react";
import CodeEditor from "../components/CodeEditor/CodeEditor";

/**
 * EditorPage Component
 * Host page for Monaco Editor with theme state management and full panel layout.
 */
const EditorPage = () => {
  // Application dark mode state (defaults to true)
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div
      className="editor-page"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",
        padding: "16px",
        boxSizing: "border-box",
        backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
        color: isDarkMode ? "#ffffff" : "#000000",
        transition: "background-color 0.3s, color 0.3s",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <h2 style={{ margin: 0 }}>SyncSpace Code Editor</h2>
        <button
          onClick={toggleTheme}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            borderRadius: "4px",
            border: isDarkMode ? "1px solid #444" : "1px solid #ccc",
            backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
            color: isDarkMode ? "#ffffff" : "#333333",
            transition: "all 0.2s ease-in-out",
          }}
        >
          {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, width: "100%", height: "100%" }}>
        <CodeEditor isDarkMode={isDarkMode} height="100%" width="100%" />
      </div>
    </div>
  );
};

export default EditorPage;
