import React from "react";
import "./Toolbar.css";

// SVG Icon Components (same as before)
const Icons = {
  Select: () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    <path d="M13 13l6 6" />
  </svg>
),
  Pen: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  Eraser: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L2 15L10.5 6.5L20 16L15 21H20Z" />
      <path d="M10.5 6.5L5 12" />
      <path d="M15 21L20 16" />
    </svg>
  ),
  Rectangle: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
    </svg>
  ),
  Circle: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  Triangle: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 3 3 21 21 21 12 3" />
    </svg>
  ),
  Line: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="20" x2="20" y2="4" />
    </svg>
  ),
  Undo: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  Redo: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
    </svg>
  ),
  Clear: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
};

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
  isDarkMode = false,
}) => {
  const tools = [
    { id: "select", label: "Select", icon: Icons.Select },
    { id: "pen", label: "Pen", icon: Icons.Pen },
    { id: "eraser", label: "Eraser", icon: Icons.Eraser },
  ];

  const shapes = [
    { id: "rectangle", label: "Rectangle", icon: Icons.Rectangle },
    { id: "circle", label: "Circle", icon: Icons.Circle },
    { id: "triangle", label: "Triangle", icon: Icons.Triangle },
    { id: "line", label: "Line", icon: Icons.Line },
  ];

  const isShapeTool = (toolId) => shapes.some((s) => s.id === toolId);

  const getToolIcon = (toolId) => {
    const allTools = [...tools, ...shapes];
    const found = allTools.find((t) => t.id === toolId);
    return found ? found.icon : null;
  };

  return (
    <div className={`toolbar-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="toolbar">
        {/* Tools Section */}
        <div className="toolbar-section">
          <div className="toolbar-group">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`toolbar-btn ${tool === t.id ? "active" : ""}`}
                  onClick={() => setTool(t.id)}
                  title={t.label}
                >
                  <span className="toolbar-btn-icon"><Icon /></span>
                  <span className="toolbar-btn-label">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* Shapes Section */}
        <div className="toolbar-section">
          <div className="toolbar-group">
            {shapes.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  className={`toolbar-btn ${tool === s.id ? "active" : ""}`}
                  onClick={() => setTool(s.id)}
                  title={s.label}
                >
                  <span className="toolbar-btn-icon"><Icon /></span>
                  <span className="toolbar-btn-label">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* Edit Section */}
        <div className="toolbar-section">
          <div className="toolbar-group">
            <button
              className={`toolbar-btn ${!canUndo ? "disabled" : ""}`}
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <span className="toolbar-btn-icon"><Icons.Undo /></span>
              <span className="toolbar-btn-label">Undo</span>
            </button>
            <button
              className={`toolbar-btn ${!canRedo ? "disabled" : ""}`}
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <span className="toolbar-btn-icon"><Icons.Redo /></span>
              <span className="toolbar-btn-label">Redo</span>
            </button>
            <button
              className="toolbar-btn toolbar-btn-danger"
              onClick={clearCanvas}
              title="Clear Canvas"
            >
              <span className="toolbar-btn-icon"><Icons.Clear /></span>
              <span className="toolbar-btn-label">Clear</span>
            </button>
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* Color Picker */}
        <div className="toolbar-section">
          <div className="toolbar-group">
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="color-picker"
                disabled={tool === "eraser"}
                title="Pick a color"
              />
              <span className="color-hex">{color}</span>
            </div>
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* Brush Size */}
        <div className="toolbar-section">
          <div className="toolbar-group">
            <div className="brush-size-control">
              <span className="brush-size-preview">
                <span
                  className="brush-size-dot"
                  style={{
                    width: Math.min(brushSize * 2, 20),
                    height: Math.min(brushSize * 2, 20),
                    backgroundColor: tool === "eraser" ? (isDarkMode ? '#333' : '#fff') : color,
                    border: `1.5px solid ${isDarkMode ? '#555' : '#333'}`,
                  }}
                />
              </span>
              <input
                type="range"
                min="1"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="brush-slider"
                title={`Brush size: ${brushSize}px`}
              />
              <span className="brush-size-value">{brushSize}px</span>
            </div>
          </div>
        </div>

        {/* Status - Hidden on small screens */}
        <div className="toolbar-section toolbar-info">
          <div className="toolbar-group">
            <div className="toolbar-status">
              <span className="toolbar-status-icon">
                {(() => {
                  const Icon = getToolIcon(tool);
                  return Icon ? <Icon /> : null;
                })()}
              </span>
              <span className="toolbar-status-text">
                {tool.charAt(0).toUpperCase() + tool.slice(1)}
              </span>
              {isShapeTool(tool) && (
                <span className="toolbar-status-badge">Shape</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;