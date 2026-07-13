import React from "react";

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
}) => {
  return (
    <div className="toolbar">
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
    </div>
  );
};

export default Toolbar;
