import { useState, useCallback } from "react";

const useCanvas = (yjsDeleteShape, yjsAddShape) => {
  const [lines, setLines] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);

  // ---------- START DRAWING ----------
  const startDrawing = useCallback((newLine) => {
    setIsDrawing(true);
    setCurrentLine(newLine);
    setRedoStack([]);
  }, []);

  // ---------- DRAW ----------
  const draw = useCallback(
    (x, y) => {
      if (!isDrawing || !currentLine) return;

      const updatedLine = {
        ...currentLine,
        points: [...currentLine.points, x, y],
      };
      setCurrentLine(updatedLine);
    },
    [isDrawing, currentLine],
  );

  // ---------- STOP DRAWING ----------
  const stopDrawing = useCallback(() => {
    if (currentLine && currentLine.points.length > 1) {
      setLines((prev) => [...prev, currentLine]);
    }
    setIsDrawing(false);
    setCurrentLine(null);
  }, [currentLine]);

  // ---------- UNDO ----------
  const undo = useCallback(() => {
    if (lines.length === 0) return;

    // 1. Get the last line (shape to undo)
    const lastLine = lines[lines.length - 1];
    
    // 2. Store in redo stack (with full data for redo)
    setRedoStack((prev) => [...prev, { ...lastLine }]);
    
    // 3. Remove from local state
    setLines((prev) => prev.slice(0, -1));
    
    // 4. Remove from Yjs shared array
    if (lastLine.id && yjsDeleteShape) {
      yjsDeleteShape(lastLine.id);
    }
  }, [lines, yjsDeleteShape]);

  // ---------- REDO ----------
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    // 1. Get the last undone shape from redo stack
    const nextLine = redoStack[redoStack.length - 1];
    
    // 2. Remove from redo stack
    setRedoStack((prev) => prev.slice(0, -1));
    
    // 3. Add back to local state
    setLines((prev) => [...prev, { ...nextLine }]);
    
    // 4. Add back to Yjs shared array
    if (nextLine.id && yjsAddShape) {
      yjsAddShape(nextLine);
    }
  }, [redoStack, yjsAddShape]);

  // ---------- CLEAR CANVAS ----------
  const clearCanvas = useCallback(() => {
    if (lines.length === 0) return;
    
    // 1. Save all lines to redo stack (for potential redo)
    setRedoStack((prev) => [...prev, ...lines.map(line => ({ ...line }))]);
    
    // 2. Get all IDs before clearing
    const shapeIds = lines.map(line => line.id).filter(id => id);
    
    // 3. Clear local state
    setLines([]);
    
    // 4. Remove ALL shapes from Yjs
    if (yjsDeleteShape) {
      shapeIds.forEach((id) => {
        yjsDeleteShape(id);
      });
    }
  }, [lines, yjsDeleteShape]);

  return {
    lines,
    redoStack,
    isDrawing,
    setIsDrawing,
    currentLine,
    startDrawing,
    draw,
    stopDrawing,
    undo,
    redo,
    clearCanvas,
    setLines,
    setRedoStack,
  };
};

export default useCanvas;