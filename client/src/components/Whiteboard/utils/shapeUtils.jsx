import React from "react";
import { Line, Rect, Circle } from "react-konva";

// ---------- Shape creation ----------
export const createShapeObject = (type, startX, startY, endX, endY, color, brushSize, username) => ({
  id: `shape-${username || "anonymous"}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  startX,
  startY,
  endX,
  endY,
  color,
  strokeWidth: brushSize,
  createdBy: username || "anonymous",
  timestamp: Date.now(),
});

// ---------- Render a single drawing item ----------
export const renderDrawing = (
  item,
  index,
  selectedId,
  tool,
  setSelectedId,
  dragStartRef,
  updateDraggingShape,
  updateShapeInYjs,
  setLines,
  username
) => {
  // ---------- FREEHAND LINES ----------
  if (item.type === "freehand" || item.tool === "pen" || item.tool === "eraser") {
    const isSelected = selectedId === item.id;
    const isSelectable = tool === "select";

    return (
      <Line
        key={index}
        id={item.id}
        points={item.points}
        stroke={item.color}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={item.globalCompositeOperation || "source-over"}
        draggable={isSelectable}
        listening={isSelectable}
        hitStrokeWidth={Math.max(item.size, 8)}
        onClick={(e) => {
          e.cancelBubble = true;
          if (isSelectable) setSelectedId(item.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          if (isSelectable) setSelectedId(item.id);
        }}
        onDragStart={(e) => {
          const node = e.target;
          dragStartRef.current[item.id] = {
            initialX: node.x(),
            initialY: node.y(),
            originalPoints: [...item.points],
          };
        }}
        onDragMove={(e) => {
          if (tool !== "select") return;
          const node = e.target;
          const originalPoints = dragStartRef.current[item.id]?.originalPoints;
          if (!originalPoints) return;
          const dx2 = node.x() - dragStartRef.current[item.id].initialX;
          const dy2 = node.y() - dragStartRef.current[item.id].initialY;
          const newPoints = originalPoints.map((p, i) => (i % 2 === 0 ? p + dx2 : p + dy2));
          const draggedShape = {
            id: item.id,
            type: "freehand",
            tool: item.tool || "pen",
            color: item.color,
            size: item.size,
            points: newPoints,
            createdBy: item.createdBy || username,
          };
          updateDraggingShape(draggedShape);
        }}
        onDragEnd={(e) => {
          if (!isSelectable) return;
          const node = e.target;
          const startData = dragStartRef.current[item.id];
          if (!startData) return;
          
          const dx = node.x() - startData.initialX;
          const dy = node.y() - startData.initialY;
          
          if (dx === 0 && dy === 0) {
            delete dragStartRef.current[item.id];
            updateDraggingShape(null);
            return;
          }
          
          const newPoints = startData.originalPoints.map((p, i) => {
            return i % 2 === 0 ? p + dx : p + dy;
          });
          
          const updatedItem = { ...item, points: newPoints };
          setLines((prev) => prev.map((l) => (l.id === item.id ? updatedItem : l)));
          
          node.x(0);
          node.y(0);
          
          const yjsShape = {
            id: item.id,
            type: item.tool || "pen",
            stroke: item.color,
            strokeWidth: item.size,
            points: newPoints,
            createdBy: item.createdBy || username,
            timestamp: Date.now(),
          };
          updateShapeInYjs(yjsShape);
          delete dragStartRef.current[item.id];
          updateDraggingShape(null);
        }}
        strokeWidth={isSelected ? item.size + 2 : item.size}
        fill={isSelected ? "rgba(77, 171, 247, 0.05)" : "transparent"}
      />
    );
  }

  // ---------- SHAPES ----------
  const { startX, startY, endX, endY, color, strokeWidth, type, id } = item;
  const width = endX - startX;
  const height = endY - startY;
  const isSelected = selectedId === id;

  const shapeProps = {
    id: id,
    stroke: color,
    strokeWidth: isSelected ? strokeWidth + 2 : strokeWidth,
    draggable: tool === "select",
    listening: true,
    onClick: (e) => {
      e.cancelBubble = true;
      if (tool === "select") setSelectedId(id);
    },
    onTap: (e) => {
      e.cancelBubble = true;
      if (tool === "select") setSelectedId(id);
    },
    onDragStart: (e) => {
      const node = e.target;
      dragStartRef.current[id] = {
        initialX: node.x(),
        initialY: node.y(),
        originalStartX: startX,
        originalStartY: startY,
        originalEndX: endX,
        originalEndY: endY,
      };
    },
    onDragMove: (e) => {
      if (tool !== "select") return;
      const node = e.target;
      const startData = dragStartRef.current[id];
      if (!startData) return;
      const dx = node.x() - startData.initialX;
      const dy = node.y() - startData.initialY;
      const draggedShape = {
        id: item.id,
        type: item.type,
        startX: startData.originalStartX + dx,
        startY: startData.originalStartY + dy,
        endX: startData.originalEndX + dx,
        endY: startData.originalEndY + dy,
        color: item.color,
        strokeWidth: item.strokeWidth,
        createdBy: item.createdBy || username,
      };
      updateDraggingShape(draggedShape);
    },
    onDragEnd: (e) => {
      if (tool !== "select") return;
      const node = e.target;
      const startData = dragStartRef.current[id];
      if (!startData) return;
      
      const dx = node.x() - startData.initialX;
      const dy = node.y() - startData.initialY;
      
      if (dx === 0 && dy === 0) {
        delete dragStartRef.current[id];
        updateDraggingShape(null);
        return;
      }
      
      const newStartX = startData.originalStartX + dx;
      const newStartY = startData.originalStartY + dy;
      const newEndX = startData.originalEndX + dx;
      const newEndY = startData.originalEndY + dy;
      
      const updatedItem = {
        ...item,
        startX: newStartX,
        startY: newStartY,
        endX: newEndX,
        endY: newEndY,
      };
      
      setLines((prev) => prev.map((l) => (l.id === id ? updatedItem : l)));
      
      node.x(0);
      node.y(0);
      
      const yjsShape = {
        id: id,
        type: type,
        startX: newStartX,
        startY: newStartY,
        endX: newEndX,
        endY: newEndY,
        color: color,
        strokeWidth: strokeWidth,
        createdBy: item.createdBy || username,
        timestamp: Date.now(),
      };
      updateShapeInYjs(yjsShape);
      delete dragStartRef.current[id];
      updateDraggingShape(null);
    },
    fill: isSelected ? "rgba(77, 171, 247, 0.1)" : "transparent",
  };

  switch (type) {
    case "rectangle": {
      const rectX = Math.min(startX, endX);
      const rectY = Math.min(startY, endY);
      const rectW = Math.abs(width);
      const rectH = Math.abs(height);
      return (
        <Rect
          key={index}
          {...shapeProps}
          x={rectX}
          y={rectY}
          width={rectW}
          height={rectH}
        />
      );
    }
    case "circle": {
      const cx = (startX + endX) / 2;
      const cy = (startY + endY) / 2;
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
      return (
        <Circle
          key={index}
          {...shapeProps}
          x={cx}
          y={cy}
          radius={radius}
        />
      );
    }
    case "triangle": {
      const baseMidX = (startX + endX) / 2;
      const baseMidY = (startY + endY) / 2;
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return null;
      const perpX = -dy / len;
      const perpY = dx / len;
      const heightThird = len * 0.866;
      const thirdX = baseMidX + perpX * heightThird;
      const thirdY = baseMidY + perpY * heightThird;
      const points = [startX, startY, endX, endY, thirdX, thirdY, startX, startY];
      return (
        <Line
          key={index}
          {...shapeProps}
          points={points}
          closed
        />
      );
    }
    case "line": {
      return (
        <Line
          key={index}
          {...shapeProps}
          points={[startX, startY, endX, endY]}
          lineCap="round"
        />
      );
    }
    default:
      return null;
  }
};