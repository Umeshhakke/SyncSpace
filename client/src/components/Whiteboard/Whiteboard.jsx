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

  // Handle window resize
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      setStageSize({
        width: rect.width || 800,
        height: rect.height || 600,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  /**
   * ============================================
   * addRemoteShape - Add shape from remote user
   * ============================================
   * This function accepts a shape object and adds it to the correct state.
   * Member 4 will call this function when receiving shapes via Socket.IO.
   *
   * Shape Format:
   * Line:    { id, type: "line", points: [], color, strokeWidth }
   * Rect:    { id, type: "rectangle", x, y, width, height, color, strokeWidth }
   * Text:    { id, type: "text", x, y, text, color, fontSize }
   *
   * @param {Object} shapeData - The shape object to add
   */
  const addRemoteShape = (shapeData) => {
    console.log("📥 Remote shape received:", shapeData);

    switch (shapeData.type) {
      case "line":
        setLines((prev) => [...prev, shapeData]);
        console.log("✅ Line added from remote");
        break;

      case "rectangle":
        setRectangles((prev) => [...prev, shapeData]);
        console.log("✅ Rectangle added from remote");
        break;

      case "text":
        setTexts((prev) => [...prev, shapeData]);
        console.log("✅ Text added from remote");
        break;

      default:
        console.warn("⚠️ Unknown shape type:", shapeData.type);
        break;
    }
  };

  /**
   * ============================================
   * createShape - Create a new shape with unique ID
   * ============================================
   * This function ensures every shape has a unique ID.
   * Used for local shape creation.
   *
   * @param {string} type - "line", "rectangle", or "text"
   * @param {Object} data - Shape-specific data
   * @returns {Object} Shape object with unique ID
   */
  const createShape = (type, data) => {
    return {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substr(2, 9),
      type: type,
      ...data,
    };
  };

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

      const fontSize = Math.max(12, brushSize * 4);

      // Create text shape with unique ID
      const newText = createShape("text", {
        x: point.x,
        y: point.y,
        text: value.trim(),
        fontSize: fontSize,
        color: color,
        fontFamily: "Arial, sans-serif",
      });

      setTexts((prev) => [...prev, newText]);
      console.log("📝 Text created locally:", newText);
      return;
    }

    // Handle Rectangle Tool
    if (tool === "rectangle") {
      // Create rectangle shape with unique ID (will be updated on mouse move)
      const newRect = createShape("rectangle", {
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        color: color,
        strokeWidth: brushSize,
        fill: "transparent",
      });

      setCurrentRect(newRect);
      return;
    }

    // Handle Pencil/Eraser
    setIsDrawing(true);

    // Create line shape with unique ID
    const newLine = createShape("line", {
      color: tool === "eraser" ? "#ffffff" : color,
      strokeWidth: tool === "eraser" ? brushSize * 2 : brushSize,
      points: [point.x, point.y],
      globalCompositeOperation:
        tool === "eraser" ? "destination-out" : "source-over",
    });

    setLines((prev) => [...prev, newLine]);
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    if (tool === "rectangle") {
      if (!currentRect) return;

      setCurrentRect({
        ...currentRect,
        width: point.x - currentRect.x,
        height: point.y - currentRect.y,
      });
      return;
    }

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
        if (
          Math.abs(currentRect.width) > 5 &&
          Math.abs(currentRect.height) > 5
        ) {
          setRectangles((prev) => [...prev, currentRect]);
          console.log("📐 Rectangle created locally:", currentRect);
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

  // ============================================
  // TEST: Simulate remote shape (Remove after testing)
  // ============================================
  useEffect(() => {
    // This simulates receiving a shape from another user
    // Uncomment to test remote shape addition
    // const testRemoteShape = {
    //   id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
    //   type: 'text',
    //   x: 200,
    //   y: 150,
    //   text: '👋 Remote User',
    //   color: '#ef4444',
    //   fontSize: 24,
    //   fontFamily: 'Arial, sans-serif',
    // };
    //
    // // Add the remote shape after 2 seconds
    // const timer = setTimeout(() => {
    //   addRemoteShape(testRemoteShape);
    // }, 2000);
    //
    // return () => clearTimeout(timer);
  }, []);

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
                  stroke={rect.color}
                  strokeWidth={rect.strokeWidth || 2}
                  fill={rect.fill || "transparent"}
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
                  fill={text.color}
                  fontFamily={text.fontFamily || "Arial, sans-serif"}
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
