import React from "react";
import { Link } from "react-router-dom";

const Toolbar = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  undo,
  redo,
  clearCanvas,
  canUndo,
  canRedo,
  activeTab = "whiteboard",
  setActiveTab,
  isDarkMode = true,
  setIsDarkMode,
}) => {
  return (
    <div className="toolbar">
      {/* Mode / View Switcher Group */}
      {setActiveTab && (
        <>
          <div className="toolbar-group view-switcher-group">
            <button
              className={`toolbar-view-btn ${activeTab === "whiteboard" ? "active" : ""}`}
              onClick={() => setActiveTab("whiteboard")}
              title="Whiteboard Canvas"
            >
              🎨 Whiteboard
            </button>
            <button
              className={`toolbar-view-btn ${activeTab === "editor" ? "active" : ""}`}
              onClick={() => setActiveTab("editor")}
              title="Monaco Code Editor"
            >
              💻 Code Editor
            </button>
            <button
              className={`toolbar-view-btn ${activeTab === "split" ? "active" : ""}`}
              onClick={() => setActiveTab("split")}
              title="Split View (Canvas + Code)"
            >
              ⚡ Split View
            </button>
            <Link
              to="/login"
              className="toolbar-view-btn"
              title="User Login"
              style={{ textDecoration: "none" }}
            >
              🔐 Login
            </Link>
            <Link
              to="/profile"
              className="toolbar-view-btn"
              title="User Profile"
              style={{ textDecoration: "none" }}
            >
              👤 Profile
            </Link>
          </div>
          <div className="toolbar-divider"></div>
        </>
      )}

      {/* Editor Theme Toggle */}
      {setIsDarkMode && (activeTab === "editor" || activeTab === "split") && (
        <>
          <div className="toolbar-group">
            <button
              className="toolbar-view-btn"
              onClick={() => setIsDarkMode((prev) => !prev)}
              title="Toggle Code Editor Theme"
            >
              {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
          <div className="toolbar-divider"></div>
        </>
      )}

      {/* Whiteboard Pencil & Eraser Tools */}
      {(activeTab === "whiteboard" || activeTab === "split") && (
        <>
          <div className="toolbar-group">
            <button
              className={`toolbar-btn ${tool === "pen" ? "active" : ""}`}
              onClick={() => setTool("pen")}
              title="Pencil"
            >
              ✏️
            </button>
            <button
              className={`toolbar-btn ${tool === "eraser" ? "active" : ""}`}
              onClick={() => setTool("eraser")}
              title="Eraser"
            >
              🧹
            </button>
          </div>

          <div className="toolbar-divider"></div>

          <div className="toolbar-group">
            <button
              className="toolbar-btn"
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
            >
              ↩️
            </button>
            <button
              className="toolbar-btn"
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
            >
              ↪️
            </button>
          </div>

          <div className="toolbar-divider"></div>

          <div className="toolbar-group">
            <button
              className="toolbar-btn toolbar-btn-danger"
              onClick={clearCanvas}
              title="Clear Canvas"
            >
              🗑️
            </button>
          </div>

          <div className="toolbar-divider"></div>

          <div className="toolbar-group">
            <label className="toolbar-label">
              Color
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="color-picker"
                disabled={tool === "eraser"}
              />
            </label>
          </div>

          <div className="toolbar-divider"></div>

          <div className="toolbar-group toolbar-slider-group">
            <label className="toolbar-label">
              Size: {brushSize}px
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="brush-slider"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
};

export default Toolbar;
