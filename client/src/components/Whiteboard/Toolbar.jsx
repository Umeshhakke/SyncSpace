import React from "react";
import "../../styles/whiteboard.css";

const Toolbar = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  clearCanvas,
}) => {
  const getToolName = () => {
    switch (tool) {
      case "pencil":
        return "✏️ Pen";
      case "rectangle":
        return "▭ Rectangle";
      case "text":
        return "📝 Text";
      case "eraser":
        return "🧹 Eraser";
      default:
        return "✏️ Pen";
    }
  };

  return (
    <div className="toolbar">
      {/* Tool Selection */}
      <div className="toolbar-section">
        <button
          className={`toolbar-btn ${tool === "pencil" ? "active" : ""}`}
          onClick={() => {
            setTool("pencil");
            console.log("✏️ Pen Tool Selected");
          }}
          title="Pen Tool"
        >
          ✏️ Pen
        </button>

        <button
          className={`toolbar-btn ${tool === "rectangle" ? "active" : ""}`}
          onClick={() => {
            setTool("rectangle");
            console.log("▭ Rectangle Tool Selected");
          }}
          title="Rectangle Tool"
        >
          ▭ Rectangle
        </button>

        <button
          className={`toolbar-btn ${tool === "text" ? "active" : ""}`}
          onClick={() => {
            setTool("text");
            console.log("📝 Text Tool Selected");
          }}
          title="Text Tool"
        >
          📝 Text
        </button>

        <button
          className={`toolbar-btn ${tool === "eraser" ? "active" : ""}`}
          onClick={() => {
            setTool("eraser");
            console.log("🧹 Eraser Tool Selected");
          }}
          title="Eraser Tool"
        >
          🧹 Eraser
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Color Picker */}
      <div className="toolbar-section">
        <label className="toolbar-label" title="Stroke Color">
          🎨
          <input
            type="color"
            className="color-picker"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              console.log("🎨 Color Changed:", e.target.value);
            }}
            disabled={tool === "eraser"}
          />
        </label>
      </div>

      <div className="toolbar-divider"></div>

      {/* Brush Size */}
      <div className="toolbar-section toolbar-slider">
        <label className="toolbar-label" title="Stroke Width">
          📏
          <input
            type="range"
            className="brush-slider"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => {
              setBrushSize(Number(e.target.value));
              console.log("📏 Brush Size:", e.target.value);
            }}
          />
          <span className="brush-size-value">{brushSize}px</span>
        </label>
      </div>

      <div className="toolbar-divider"></div>

      {/* Clear Button */}
      <button
        className="toolbar-btn toolbar-btn-danger"
        onClick={() => {
          clearCanvas();
          console.log("🗑️ Canvas Cleared");
        }}
        title="Clear Canvas"
      >
        🗑️ Clear
      </button>

      {/* Active Tool Display */}
      <div className="toolbar-active-tool">
        <span className="active-tool-label">Active:</span>
        <span className="active-tool-name">{getToolName()}</span>
      </div>
    </div>
  );
};

export default Toolbar;
