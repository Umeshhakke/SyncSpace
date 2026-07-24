import React from "react";
import { Line, Rect, Text } from "react-konva";

/**
 * ============================================
 * ShapeRenderer - Render a shape based on its type
 * ============================================
 * This component centralizes all shape rendering logic.
 * Each shape type is rendered with appropriate Konva component.
 *
 * @param {Object} props
 * @param {Object} props.shape - Shape object to render
 * @param {boolean} props.isPreview - Is this a preview shape?
 */
const ShapeRenderer = ({ shape, isPreview = false }) => {
  if (!shape || !shape.type) {
    console.warn(" Unknown shape passed to ShapeRenderer:", shape);
    return null;
  }

  switch (shape.type) {
    case "line":
      return (
        <Line
          key={shape.id}
          points={shape.points}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          lineCap="round"
          lineJoin="round"
          tension={isPreview ? 0 : 0.5}
          globalCompositeOperation={
            shape.globalCompositeOperation || "source-over"
          }
          hitStrokeWidth={0}
          listening={false}
          dash={isPreview ? [6, 4] : undefined}
          opacity={isPreview ? 0.7 : 1}
        />
      );

    case "rectangle":
      return (
        <Rect
          key={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth || 2}
          fill={shape.fill || "transparent"}
          cornerRadius={shape.cornerRadius || 0}
          listening={false}
          dash={isPreview ? [6, 4] : undefined}
          opacity={isPreview ? 0.7 : 1}
        />
      );

    case "text":
      return (
        <Text
          key={shape.id}
          x={shape.x}
          y={shape.y}
          text={shape.text}
          fill={shape.color}
          fontSize={shape.fontSize}
          fontFamily={shape.fontFamily || "Arial, sans-serif"}
          listening={false}
          opacity={isPreview ? 0.7 : 1}
        />
      );

    default:
      console.warn(" Unknown shape type:", shape.type);
      return null;
  }
};

export default ShapeRenderer;
