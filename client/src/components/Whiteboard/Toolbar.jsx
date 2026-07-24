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
  return (
    <div className="toolbar">
      {/* Pencil Button */}
      <button
        className={`toolbar-btn toolbar-btn-primary ${tool === "pencil" ? "active" : ""}`}
        onClick={() => {
          setTool("pencil");
          console.log("✏️ Pencil Selected");
        }}
        title="Pencil Tool"
      >
        <span className="toolbar-icon">✏️</span>
        <span className="toolbar-label">Pencil</span>
      </button>

      {/* Rectangle Button */}
      <button
        className={`toolbar-btn toolbar-btn-primary ${tool === "rectangle" ? "active" : ""}`}
        onClick={() => {
          setTool("rectangle");
          console.log("📐 Rectangle Tool Selected");
        }}
        title="Rectangle Tool"
      >
        <span className="toolbar-icon">📐</span>
        <span className="toolbar-label">Rectangle</span>
      </button>

      {/* Text Button */}
      <button
        className={`toolbar-btn toolbar-btn-primary ${tool === "text" ? "active" : ""}`}
        onClick={() => {
          setTool("text");
          console.log("📝 Text Tool Selected");
        }}
        title="Text Tool"
      >
        <span className="toolbar-icon">📝</span>
        <span className="toolbar-label">Text</span>
      </button>

      {/* Eraser Button */}
      <button
        className={`toolbar-btn toolbar-btn-secondary ${tool === "eraser" ? "active" : ""}`}
        onClick={() => {
          setTool("eraser");
          console.log("🧹 Eraser Selected");
        }}
        title="Eraser Tool"
      >
        <span className="toolbar-icon">🧹</span>
        <span className="toolbar-label">Eraser</span>
      </button>

      {/* Divider */}
      <div className="toolbar-divider"></div>

      {/* Color Picker */}
      <div className="toolbar-group">
        <label className="toolbar-label" title="Choose Color">
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

      {/* Divider */}
      <div className="toolbar-divider"></div>

      {/* Brush Size Slider */}
      <div className="toolbar-group">
        <label className="toolbar-label" title="Brush Size">
          📏
          <input
            type="range"
            className="brush-slider"
            min="1"
            max="30"
            value={brushSize}
            onChange={(e) => {
              setBrushSize(Number(e.target.value));
              console.log("📏 Brush Size:", e.target.value);
            }}
          />
          <span className="brush-size-value">{brushSize}px</span>
        </label>
      </div>

      {/* Divider */}
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
        <span className="toolbar-icon">🗑️</span>
        <span className="toolbar-label">Clear</span>
      </button>
    </div>
  );
};

export default Toolbar;
