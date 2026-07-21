import { useEffect, useRef, useCallback } from "react";

export const useWhiteboardSync = (shapesArray, lines, setLines, selectedId, setSelectedId, username) => {
  const syncedIdsRef = useRef(new Set());

  // Clear cache when shapesArray changes
  useEffect(() => {
    syncedIdsRef.current.clear();
  }, [shapesArray]);

  // ---------- Sync remote shapes from Yjs ----------
  useEffect(() => {
    if (!shapesArray) return;
    const handleObserve = (event) => {
      if (event.transaction.local) return;
      let hasDeletion = false;
      event.delta.forEach((op) => {
        if (op.insert) {
          const inserted = Array.isArray(op.insert) ? op.insert : [op.insert];
          inserted.forEach((shape) => {
            syncedIdsRef.current.add(shape.id);
            let localItem;
            if (shape.points && shape.points.length > 0) {
              localItem = {
                id: shape.id,
                type: "freehand",
                tool: shape.type || "pen",
                color: shape.stroke,
                size: shape.strokeWidth,
                points: shape.points,
                globalCompositeOperation: shape.type === "eraser" ? "destination-out" : "source-over",
              };
            } else {
              localItem = {
                id: shape.id,
                type: shape.type,
                startX: shape.startX,
                startY: shape.startY,
                endX: shape.endX,
                endY: shape.endY,
                color: shape.color,
                strokeWidth: shape.strokeWidth,
                createdBy: shape.createdBy,
                timestamp: shape.timestamp,
              };
            }
            setLines((prev) => {
              if (prev.some((item) => item.id === shape.id)) return prev;
              return [...prev, localItem];
            });
          });
        }
        if (op.delete) hasDeletion = true;
      });
      if (hasDeletion) {
        const remoteIds = new Set(shapesArray.toArray().map((shape) => shape.id));
        setLines((prev) => prev.filter((item) => !item.id || remoteIds.has(item.id)));
        if (selectedId && !remoteIds.has(selectedId)) {
          setSelectedId(null);
        }
      }
    };
    shapesArray.observe(handleObserve);
    return () => shapesArray.unobserve(handleObserve);
  }, [shapesArray, setLines, selectedId, setSelectedId]);

  // ---------- Sync local shapes to Yjs ----------
  useEffect(() => {
    if (!shapesArray || lines.length === 0) return;
    const unsyncedIndices = [];
    lines.forEach((line, idx) => {
      if (!line.id || !syncedIdsRef.current.has(line.id)) {
        unsyncedIndices.push(idx);
      }
    });
    if (unsyncedIndices.length === 0) return;
    const shapesToPush = [];
    const updatedLines = [...lines];
    unsyncedIndices.forEach((idx) => {
      const localItem = updatedLines[idx];
      let uniqueId = localItem.id || `shape-${username || "anonymous"}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let yjsShape = { id: uniqueId };
      if (localItem.type === "freehand" || localItem.tool === "pen" || localItem.tool === "eraser") {
        yjsShape = {
          id: uniqueId,
          type: localItem.tool || "pen",
          stroke: localItem.color,
          strokeWidth: localItem.size,
          points: localItem.points || [],
          createdBy: username || "anonymous",
          timestamp: Date.now(),
        };
      } else {
        yjsShape = {
          id: uniqueId,
          type: localItem.type,
          startX: localItem.startX,
          startY: localItem.startY,
          endX: localItem.endX,
          endY: localItem.endY,
          color: localItem.color,
          strokeWidth: localItem.strokeWidth,
          createdBy: username || "anonymous",
          timestamp: Date.now(),
        };
      }
      shapesToPush.push(yjsShape);
      syncedIdsRef.current.add(uniqueId);
      updatedLines[idx] = { ...localItem, id: uniqueId };
    });
    setLines(updatedLines);
    if (shapesToPush.length > 0) {
      shapesArray.push(shapesToPush);
    }
  }, [lines, shapesArray, username, setLines]);

  // ---------- Update shape in Yjs ----------
  const updateShapeInYjs = useCallback((shape) => {
    if (!shapesArray) return;
    const arr = shapesArray.toArray();
    const index = arr.findIndex(s => s.id === shape.id);
    if (index !== -1) {
      let yjsShape;
      if (shape.points && shape.points.length > 0) {
        yjsShape = {
          id: shape.id,
          type: shape.type || "pen",
          stroke: shape.color,
          strokeWidth: shape.size,
          points: shape.points,
          createdBy: shape.createdBy || username,
          timestamp: Date.now(),
        };
      } else {
        yjsShape = {
          id: shape.id,
          type: shape.type,
          startX: shape.startX,
          startY: shape.startY,
          endX: shape.endX,
          endY: shape.endY,
          color: shape.color,
          strokeWidth: shape.strokeWidth,
          createdBy: shape.createdBy || username,
          timestamp: Date.now(),
        };
      }
      shapesArray.delete(index, 1);
      shapesArray.insert(index, [yjsShape]);
      console.log(`📦 Updated shape ${shape.id} in Yjs`);
    }
  }, [shapesArray, username]);

  // ---------- Delete shape from Yjs ----------
  const deleteShapeFromYjs = useCallback((shapeId) => {
    if (!shapesArray) return;
    const index = shapesArray.toArray().findIndex(shape => shape.id === shapeId);
    if (index !== -1) {
      shapesArray.delete(index, 1);
      console.log(`🗑️ Deleted shape ${shapeId} from Yjs`);
    }
  }, [shapesArray]);

  return {
    syncedIdsRef,
    updateShapeInYjs,
    deleteShapeFromYjs,
  };
};