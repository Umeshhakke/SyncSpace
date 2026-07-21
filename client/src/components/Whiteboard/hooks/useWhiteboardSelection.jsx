import { useState, useRef, useEffect } from "react";

export const useWhiteboardSelection = (stageRef, transformerRef) => {
  const [selectedId, setSelectedId] = useState(null);
  const dragStartRef = useRef({});

  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, stageRef, transformerRef]);

  return { selectedId, setSelectedId, dragStartRef };
};