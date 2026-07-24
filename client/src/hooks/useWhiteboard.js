import { useState, useCallback } from "react";
import {
  createLine,
  createRectangle,
  createText,
  isValidShape,
} from "../utils/shapeFactory";

/**
 * ============================================
 * useWhiteboard - Custom hook for whiteboard logic
 * ============================================
 * This hook manages whiteboard state and provides
 * functions for adding shapes locally and remotely.
 *
 * Member 4 will use this hook to integrate Socket.IO.
 *
 * @returns {Object} Whiteboard state and functions
 */
const useWhiteboard = () => {
  // Shape states
  const [lines, setLines] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [texts, setTexts] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);

  /**
   * Add a shape from a remote user (via Socket.IO)
   * @param {Object} shapeData - Shape object to add
   * @returns {boolean} Success status
   */
  const addRemoteShape = useCallback((shapeData) => {
    console.log(" Remote shape received:", shapeData);

    // Validate shape
    if (!isValidShape(shapeData)) {
      console.warn(" Invalid shape received:", shapeData);
      return false;
    }

    switch (shapeData.type) {
      case "line":
        setLines((prev) => [...prev, shapeData]);
        console.log(" Line added from remote");
        return true;

      case "rectangle":
        setRectangles((prev) => [...prev, shapeData]);
        console.log(" Rectangle added from remote");
        return true;

      case "text":
        setTexts((prev) => [...prev, shapeData]);
        console.log(" Text added from remote");
        return true;

      default:
        console.warn(" Unknown shape type:", shapeData.type);
        return false;
    }
  }, []);

  /**
   * Add a shape from the local user
   * @param {Object} shapeData - Shape object to add
   * @returns {boolean} Success status
   */
  const addLocalShape = useCallback((shapeData) => {
    if (!isValidShape(shapeData)) {
      console.warn(" Invalid local shape:", shapeData);
      return false;
    }

    switch (shapeData.type) {
      case "line":
        setLines((prev) => [...prev, shapeData]);
        return true;

      case "rectangle":
        setRectangles((prev) => [...prev, shapeData]);
        return true;

      case "text":
        setTexts((prev) => [...prev, shapeData]);
        return true;

      default:
        return false;
    }
  }, []);

  /**
   * Clear all shapes from the whiteboard
   */
  const clearAllShapes = useCallback(() => {
    setLines([]);
    setRectangles([]);
    setTexts([]);
    setCurrentRect(null);
    console.log(" All shapes cleared");
  }, []);

  /**
   * Get all shapes as a single array
   * @returns {Object[]} Array of all shapes
   */
  const getAllShapes = useCallback(() => {
    return [...lines, ...rectangles, ...texts];
  }, [lines, rectangles, texts]);

  /**
   * Get shape count by type
   * @returns {Object} Count of each shape type
   */
  const getShapeCounts = useCallback(() => {
    return {
      lines: lines.length,
      rectangles: rectangles.length,
      texts: texts.length,
      total: lines.length + rectangles.length + texts.length,
    };
  }, [lines, rectangles, texts]);

  return {
    // State
    lines,
    rectangles,
    texts,
    isDrawing,
    currentRect,

    // Setters
    setLines,
    setRectangles,
    setTexts,
    setIsDrawing,
    setCurrentRect,

    // Functions
    addRemoteShape,
    addLocalShape,
    clearAllShapes,
    getAllShapes,
    getShapeCounts,
  };
};

export default useWhiteboard;
