import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line } from "react-konva";
import Toolbar from "./Toolbar";
import useCanvas from "../../hooks/useCanvas";

const Whiteboard = () => {
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const stageRef = useRef(null);

  const {
    lines,
    redoStack,
    isDrawing,
    setIsDrawing,
    startDrawing,
    draw,
    stopDrawing,
    undo,
    redo,
    clearCanvas,
    setLines,
    setRedoStack,
  } = useCanvas();

  // Handle window resize for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      const container = document.querySelector(".canvas-container");
      if (container) {
        const rect = container.getBoundingClientRect();
        setStageSize({
          width: rect.width - 4,
          height: rect.height - 4,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    const newLine = {
      tool: tool,
      color: tool === "eraser" ? "#ffffff" : color,
      size: tool === "eraser" ? brushSize * 2 : brushSize,
      points: [pos.x, pos.y],
      globalCompositeOperation:
        tool === "eraser" ? "destination-out" : "source-over",
    };
    startDrawing(newLine);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const pos = e.target.getStage().getPointerPosition();
    draw(pos.x, pos.y);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      stopDrawing();
    }
  };

  return (
    <div className="whiteboard-wrapper">
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        undo={undo}
        redo={redo}
        clearCanvas={clearCanvas}
        canUndo={lines.length > 0}
        canRedo={redoStack.length > 0}
      />
      <div className="canvas-container">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ backgroundColor: "#ffffff", cursor: "crosshair" }}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.size}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.globalCompositeOperation || "source-over"
                }
                hitStrokeWidth={0}
                listening={false}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Whiteboard;
