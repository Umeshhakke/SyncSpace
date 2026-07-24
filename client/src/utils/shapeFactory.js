/**
 * ============================================
 * Shape Factory - Create consistent shape objects
 * ============================================
 * Every shape created in the application goes through
 * these factory functions to ensure consistent format.
 *
 * @module shapeFactory
 */

/**
 * Generate a unique ID
 * @returns {string} UUID or random string
 */
const generateId = () => {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substr(2, 9);
};

/**
 * Create a Line shape
 * @param {number[]} points - Array of [x1, y1, x2, y2, ...]
 * @param {string} color - Hex color code (e.g., "#000000")
 * @param {number} strokeWidth - Line thickness in pixels
 * @param {string} [globalCompositeOperation] - "source-over" or "destination-out"
 * @returns {Object} Line shape object
 */
export function createLine(
  points,
  color,
  strokeWidth,
  globalCompositeOperation = "source-over",
) {
  return {
    id: generateId(),
    type: "line",
    points: points,
    color: color,
    strokeWidth: strokeWidth,
    globalCompositeOperation: globalCompositeOperation,
  };
}

/**
 * Create a Rectangle shape
 * @param {number} x - X position of top-left corner
 * @param {number} y - Y position of top-left corner
 * @param {number} width - Width of rectangle
 * @param {number} height - Height of rectangle
 * @param {string} color - Border color (hex)
 * @param {number} strokeWidth - Border thickness
 * @param {string} [fill] - Fill color (default: 'transparent')
 * @param {number} [cornerRadius] - Rounded corners (default: 0)
 * @returns {Object} Rectangle shape object
 */
export function createRectangle(
  x,
  y,
  width,
  height,
  color,
  strokeWidth,
  fill = "transparent",
  cornerRadius = 0,
) {
  return {
    id: generateId(),
    type: "rectangle",
    x: x,
    y: y,
    width: width,
    height: height,
    color: color,
    strokeWidth: strokeWidth,
    fill: fill,
    cornerRadius: cornerRadius,
  };
}

/**
 * Create a Text shape
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} text - Text content
 * @param {string} color - Text color (hex)
 * @param {number} fontSize - Font size in pixels
 * @param {string} [fontFamily] - Font family (default: 'Arial, sans-serif')
 * @returns {Object} Text shape object
 */
export function createText(
  x,
  y,
  text,
  color,
  fontSize,
  fontFamily = "Arial, sans-serif",
) {
  return {
    id: generateId(),
    type: "text",
    x: x,
    y: y,
    text: text,
    color: color,
    fontSize: fontSize,
    fontFamily: fontFamily,
  };
}

/**
 * Validate a shape object
 * @param {Object} shape - Shape to validate
 * @returns {boolean} True if shape is valid
 */
export function isValidShape(shape) {
  if (!shape || typeof shape !== "object") return false;
  if (!shape.id || !shape.type) return false;

  switch (shape.type) {
    case "line":
      return Array.isArray(shape.points) && shape.points.length >= 2;
    case "rectangle":
      return (
        typeof shape.x === "number" &&
        typeof shape.y === "number" &&
        typeof shape.width === "number" &&
        typeof shape.height === "number"
      );
    case "text":
      return (
        typeof shape.x === "number" &&
        typeof shape.y === "number" &&
        typeof shape.text === "string" &&
        shape.text.length > 0
      );
    default:
      return false;
  }
}

/**
 * Get shape type label
 * @param {string} type - Shape type
 * @returns {string} Human-readable label
 */
export function getShapeTypeLabel(type) {
  const labels = {
    line: "Line",
    rectangle: "Rectangle",
    text: "Text",
  };
  return labels[type] || "Unknown";
}
