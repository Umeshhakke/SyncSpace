import { useState, useCallback } from "react";

const useCanvas = () => {
  const [lines, setLines] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);

  const startDrawing = useCallback((newLine) => {
    setIsDrawing(true);
    setCurrentLine(newLine);
    setRedoStack([]);
  }, []);

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

  const stopDrawing = useCallback(() => {
    if (currentLine && currentLine.points.length > 1) {
      setLines((prev) => [...prev, currentLine]);
    }
    setIsDrawing(false);
    setCurrentLine(null);
  }, [currentLine]);

  const undo = useCallback(() => {
    if (lines.length === 0) return;

    const lastLine = lines[lines.length - 1];
    setRedoStack((prev) => [...prev, lastLine]);
    setLines((prev) => prev.slice(0, -1));
  }, [lines]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const lastRedo = redoStack[redoStack.length - 1];
    setLines((prev) => [...prev, lastRedo]);
    setRedoStack((prev) => prev.slice(0, -1));
  }, [redoStack]);

  const clearCanvas = useCallback(() => {
    setLines([]);
    setRedoStack([]);
  }, []);

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
