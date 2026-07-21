import { useState } from "react";

export const useWhiteboardState = (initialColor = "#FF6B6B") => {
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(initialColor);
  const [brushSize, setBrushSize] = useState(5);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [startPoint, setStartPoint] = useState(null);
  const [previewShape, setPreviewShape] = useState(null);

  return {
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    stageSize, setStageSize,
    startPoint, setStartPoint,
    previewShape, setPreviewShape,
  };
};