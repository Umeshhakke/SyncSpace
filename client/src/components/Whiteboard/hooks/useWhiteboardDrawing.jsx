import { useCallback } from "react";
import { createShapeObject } from "../utils/shapeUtils";

export const useWhiteboardDrawing = (
  tool,
  color,
  brushSize,
  username,
  startPoint,
  setStartPoint,
  previewShape,
  setPreviewShape,
  isDrawing, // ✅ ADDED
  setIsDrawing,
  startDrawing,
  draw,
  stopDrawing,
  setLines,
  updateLiveStroke,
  updateLiveShape,
  updateDraggingShape,
  selectedId,
  setSelectedId,
  awareness,
  updateLocalCursor,
) => {
  // ---------- Mouse down ----------
  const handleMouseDown = useCallback((e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    if (tool === "select") {
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
        updateDraggingShape(null);
      }
      return;
    }

    const isShapeTool = ["rectangle", "circle", "triangle", "line"].includes(tool);

    if (isShapeTool) {
      setStartPoint({ x: pos.x, y: pos.y });
      setIsDrawing(true);
      setPreviewShape(null);
      return;
    }

    const newLine = {
      type: "freehand",
      tool: tool,
      color: tool === "eraser" ? "#ffffff" : color,
      size: tool === "eraser" ? brushSize * 2 : brushSize,
      points: [pos.x, pos.y],
      globalCompositeOperation: tool === "eraser" ? "destination-out" : "source-over",
    };
    startDrawing(newLine);
  }, [tool, color, brushSize, setStartPoint, setIsDrawing, setPreviewShape, startDrawing, setSelectedId, updateDraggingShape]);

  // ---------- Mouse move ----------
  const handleMouseMove = useCallback((e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    const isShapeTool = ["rectangle", "circle", "triangle", "line"].includes(tool);

    if (isShapeTool && startPoint) {
      const shape = createShapeObject(tool, startPoint.x, startPoint.y, pos.x, pos.y, tool === "eraser" ? "#ffffff" : color, tool === "eraser" ? brushSize * 2 : brushSize, username);
      setPreviewShape(shape);
      updateLiveShape(shape);
      return;
    }

    if (isDrawing) {
      draw(pos.x, pos.y);
    }

    if (awareness && username && tool !== "select") {
      updateLocalCursor(pos.x, pos.y);
    }
  }, [tool, color, brushSize, username, startPoint, isDrawing, draw, setPreviewShape, updateLiveShape, awareness, updateLocalCursor]);

  // ---------- Mouse up ----------
  const handleMouseUp = useCallback((e) => {
    const isShapeTool = ["rectangle", "circle", "triangle", "line"].includes(tool);

    if (isShapeTool && startPoint) {
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) {
        setIsDrawing(false);
        setStartPoint(null);
        setPreviewShape(null);
        updateLiveShape(null);
        return;
      }
      const shape = createShapeObject(tool, startPoint.x, startPoint.y, pos.x, pos.y, tool === "eraser" ? "#ffffff" : color, tool === "eraser" ? brushSize * 2 : brushSize, username);
      setLines((prev) => [...prev, shape]);
      setIsDrawing(false);
      setStartPoint(null);
      setPreviewShape(null);
      updateLiveShape(null);
      return;
    }

    stopDrawing();
    updateLiveStroke(null);
    setIsDrawing(false);
  }, [tool, color, brushSize, username, startPoint, setLines, setIsDrawing, setStartPoint, setPreviewShape, updateLiveShape, stopDrawing, updateLiveStroke]);

  // ---------- Mouse leave ----------
  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      if (["rectangle", "circle", "triangle", "line"].includes(tool)) {
        setIsDrawing(false);
        setStartPoint(null);
        setPreviewShape(null);
        updateLiveShape(null);
      } else {
        stopDrawing();
        updateLiveStroke(null);
      }
    }
    if (awareness) {
      awareness.setLocalStateField("cursor", null);
    }
  }, [isDrawing, tool, setIsDrawing, setStartPoint, setPreviewShape, updateLiveShape, stopDrawing, updateLiveStroke, awareness]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
};