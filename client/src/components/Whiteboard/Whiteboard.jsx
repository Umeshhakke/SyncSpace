import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import Toolbar from "./Toolbar";
import ShapeRenderer from "./ShapeRenderer";
import useWhiteboard from "../../hooks/useWhiteboard";
import {
  createLine,
  createRectangle,
  createText,
} from "../../utils/shapeFactory";
import "../../styles/whiteboard.css";

const Whiteboard = () => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);

  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
  });

  // Use the whiteboard hook
  const {
    lines,
    setLines,
    rectangles,
    setRectangles,
    texts,
    setTexts,
    isDrawing,
    setIsDrawing,
    currentRect,
    setCurrentRect,
    addRemoteShape,
    clearAllShapes,
  } = useWhiteboard();

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

      // Create text shape using factory
      const newText = createText(
        point.x,
        point.y,
        value.trim(),
        color,
        fontSize,
      );

      setTexts((prev) => [...prev, newText]);
      console.log("📝 Text created locally:", newText);
      return;
    }

    // Handle Rectangle Tool
    if (tool === "rectangle") {
      // Create rectangle shape using factory
      const newRect = createRectangle(point.x, point.y, 0, 0, color, brushSize);

      setCurrentRect(newRect);
      return;
    }

    // Handle Pencil/Eraser
    setIsDrawing(true);

    // Create line shape using factory
    const newLine = createLine(
      [point.x, point.y],
      tool === "eraser" ? "#ffffff" : color,
      tool === "eraser" ? brushSize * 2 : brushSize,
      tool === "eraser" ? "destination-out" : "source-over",
    );

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
    clearAllShapes();
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
              {/* Render Lines using ShapeRenderer */}
              {lines.map((line) => (
                <ShapeRenderer key={line.id} shape={line} />
              ))}

              {/* Render Rectangles using ShapeRenderer */}
              {rectangles.map((rect) => (
                <ShapeRenderer key={rect.id} shape={rect} />
              ))}

              {/* Render Texts using ShapeRenderer */}
              {texts.map((text) => (
                <ShapeRenderer key={text.id} shape={text} />
              ))}

              {/* Render Current Rectangle (Preview) */}
              {currentRect && (
                <ShapeRenderer shape={currentRect} isPreview={true} />
              )}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
};

export default Whiteboard;
