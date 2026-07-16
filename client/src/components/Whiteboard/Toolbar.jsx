import React from "react";
import "../../styles/whiteboard.css";

const Toolbar = () => {
  // Handler functions with console logs
  const handlePencil = () => {
    console.log("✏️ Pencil Selected");
  };

  const handleEraser = () => {
    console.log("🧹 Eraser Selected");
  };

  const handleClear = () => {
    console.log("🗑️ Canvas Cleared");
  };

  const handleColor = (e) => {
    console.log("🎨 Color Changed:", e.target.value);
  };

  const handleBrush = (e) => {
    console.log("📏 Brush Size:", e.target.value);
  };

  return (
    <div className="toolbar">
      {/* Pencil Button */}
      <button
        className="toolbar-btn toolbar-btn-primary"
        onClick={handlePencil}
        title="Pencil Tool"
      >
        <span className="toolbar-icon">✏️</span>
        <span className="toolbar-label">Pencil</span>
      </button>

      {/* Eraser Button */}
      <button
        className="toolbar-btn toolbar-btn-secondary"
        onClick={handleEraser}
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
            defaultValue="#000000"
            onChange={handleColor}
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
            max="20"
            defaultValue="5"
            onChange={handleBrush}
          />
          <span className="brush-size-value">5</span>
        </label>
      </div>

      {/* Divider */}
      <div className="toolbar-divider"></div>

      {/* Clear Button */}
      <button
        className="toolbar-btn toolbar-btn-danger"
        onClick={handleClear}
        title="Clear Canvas"
      >
        <span className="toolbar-icon">🗑️</span>
        <span className="toolbar-label">Clear</span>
      </button>
    </div>
  );
};

export default Toolbar;
