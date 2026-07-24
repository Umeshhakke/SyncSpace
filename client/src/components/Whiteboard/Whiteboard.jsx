import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Text } from "react-konva";
import Toolbar from "./Toolbar";
import "../../styles/whiteboard.css";

const Whiteboard = () => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);

  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
  });

  // Drawing state
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Rectangle state
  const [rectangles, setRectangles] = useState([]);
  const [currentRect, setCurrentRect] = useState(null);

  // Text state
  const [texts, setTexts] = useState([]);

  // Tool states
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);

  // Handle window resize for responsive stage
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      setStageSize({
        width: rect.width || 800,
        height: rect.height || 600,
      });
    };

    // Initial size update
    updateSize();

    // Add resize listener
    window.addEventListener("resize", updateSize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Handle mouse down
  const handleMouseDown = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Handle Text Tool
    if (tool === "text") {
      const value = window.prompt("✏️ Enter your text:", "");

      if (!value || value.trim() === "") {
        console.log("❌ Text input cancelled or empty");
        return;
      }

      const fontSize = Math.max(12, brushSize * 4); // Brush size affects font size
      const newText = {
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substr(2, 9),
        x: point.x,
        y: point.y,
        text: value.trim(),
        fontSize: fontSize,
        fill: color,
        fontFamily: "Arial, sans-serif",
        fontStyle: "normal",
        fontWeight: "normal",
      };

      setTexts((prev) => [...prev, newText]);
      console.log("📝 Text added:", newText);
      return;
    }

    // Handle Rectangle Tool
    if (tool === "rectangle") {
      setCurrentRect({
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substr(2, 9),
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        stroke: color,
        strokeWidth: brushSize,
        fill: "transparent",
        cornerRadius: 0,
      });
      return;
    }

    // Handle Pencil/Eraser
    setIsDrawing(true);

    const newLine = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substr(2, 9),
      tool: tool,
      color: tool === "eraser" ? "#ffffff" : color,
      strokeWidth: tool === "eraser" ? brushSize * 2 : brushSize,
      points: [point.x, point.y],
      globalCompositeOperation:
        tool === "eraser" ? "destination-out" : "source-over",
    };

    setLines((prev) => [...prev, newLine]);
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Handle Rectangle Drawing
    if (tool === "rectangle") {
      if (!currentRect) return;

      setCurrentRect({
        ...currentRect,
        width: point.x - currentRect.x,
        height: point.y - currentRect.y,
      });
      return;
    }

    // Handle Pencil/Eraser Drawing
    if (!isDrawing) return;

    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;

      const updated = {
        ...last,
        points: [...last.points, point.x, point.y],
      };

      return [...prev.slice(0, -1), updated];
    });
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (tool === "rectangle") {
      if (currentRect) {
        // Only save if rectangle has size
        if (
          Math.abs(currentRect.width) > 5 &&
          Math.abs(currentRect.height) > 5
        ) {
          setRectangles((prev) => [...prev, currentRect]);
          console.log("📐 Rectangle added:", currentRect);
        }
        setCurrentRect(null);
      }
      return;
    }

    setIsDrawing(false);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (tool === "rectangle") {
      setCurrentRect(null);
    } else {
      if (isDrawing) {
        setIsDrawing(false);
      }
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    setLines([]);
    setRectangles([]);
    setTexts([]);
    setCurrentRect(null);
    console.log("🗑️ Canvas Cleared");
  };

  return (
    <div className="whiteboard-container">
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        clearCanvas={clearCanvas}
      />

      <div ref={containerRef} className="stage-container">
        {stageSize.width > 0 && stageSize.height > 0 && (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            className="whiteboard-stage"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              cursor:
                tool === "eraser"
                  ? "cell"
                  : tool === "text"
                    ? "text"
                    : "crosshair",
              backgroundColor: "#ffffff",
            }}
          >
            <Layer>
              {/* Render Lines */}
              {lines.map((line) => (
                <Line
                  key={line.id}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.5}
                  globalCompositeOperation={
                    line.globalCompositeOperation || "source-over"
                  }
                  hitStrokeWidth={0}
                  listening={false}
                />
              ))}

              {/* Render Rectangles */}
              {rectangles.map((rect) => (
                <Rect
                  key={rect.id}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  stroke={rect.stroke}
                  strokeWidth={rect.strokeWidth || 2}
                  fill={rect.fill || "transparent"}
                  cornerRadius={rect.cornerRadius || 0}
                  listening={false}
                />
              ))}

              {/* Render Texts */}
              {texts.map((text) => (
                <Text
                  key={text.id}
                  x={text.x}
                  y={text.y}
                  text={text.text}
                  fontSize={text.fontSize}
                  fill={text.fill}
                  fontFamily={text.fontFamily || "Arial, sans-serif"}
                  fontStyle={text.fontStyle || "normal"}
                  fontWeight={text.fontWeight || "normal"}
                  listening={false}
                />
              ))}

              {/* Render Current Rectangle (Preview) */}
              {currentRect && (
                <Rect
                  x={currentRect.x}
                  y={currentRect.y}
                  width={currentRect.width}
                  height={currentRect.height}
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="rgba(37, 99, 235, 0.1)"
                  dash={[6, 4]}
                  cornerRadius={0}
                  listening={false}
                />
              )}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
};

export default Whiteboard;
