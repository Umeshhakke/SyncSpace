import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CURSOR_COLORS } from "../utils/constants";

export const useWhiteboardAwareness = (awareness, doc, username) => {
  // ✅ ALL hooks called unconditionally at the top
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [remoteLiveStrokes, setRemoteLiveStrokes] = useState([]);
  const [remoteLiveShapes, setRemoteLiveShapes] = useState([]);
  const [remoteDraggingShapes, setRemoteDraggingShapes] = useState([]);
  const lastCursorUpdateRef = useRef(0);

  const userCursorColor = useMemo(
    () => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)],
    []
  );

  // Update local cursor
  const updateLocalCursor = useCallback((x, y) => {
    if (!awareness) return;
    const now = Date.now();
    if (now - lastCursorUpdateRef.current < 50) return;
    lastCursorUpdateRef.current = now;
    awareness.setLocalStateField("cursor", {
      x,
      y,
      username: username || "anonymous",
      color: userCursorColor,
    });
  }, [awareness, username, userCursorColor]);

  // Publish live stroke
  const updateLiveStroke = useCallback((lineData) => {
    if (!awareness) return;
    if (lineData) {
      awareness.setLocalStateField("liveStroke", {
        points: lineData.points,
        color: lineData.color,
        size: lineData.size,
        tool: lineData.tool || "pen",
        globalCompositeOperation: lineData.globalCompositeOperation || "source-over",
      });
    } else {
      awareness.setLocalStateField("liveStroke", null);
    }
  }, [awareness]);

  // Publish live shape preview
  const updateLiveShape = useCallback((shapeData) => {
    if (!awareness) return;
    if (shapeData) {
      awareness.setLocalStateField("liveShape", {
        ...shapeData,
        createdBy: username,
        timestamp: Date.now(),
      });
    } else {
      awareness.setLocalStateField("liveShape", null);
    }
  }, [awareness, username]);

  // Publish dragging shape
  const updateDraggingShape = useCallback((shapeData) => {
    if (!awareness) return;
    if (shapeData) {
      awareness.setLocalStateField("draggingShape", {
        ...shapeData,
        createdBy: username,
        timestamp: Date.now(),
      });
    } else {
      awareness.setLocalStateField("draggingShape", null);
    }
  }, [awareness, username]);

  // ✅ useEffect also called unconditionally
  useEffect(() => {
    if (!awareness) {
      setRemoteCursors([]);
      setRemoteLiveStrokes([]);
      setRemoteLiveShapes([]);
      setRemoteDraggingShapes([]);
      return;
    }
    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const cursors = [];
      const liveStrokes = [];
      const liveShapes = [];
      const draggingShapes = [];

      states.forEach((state, clientId) => {
        if (clientId === doc?.clientID) return;
        if (state.cursor) {
          cursors.push({
            clientId,
            x: state.cursor.x,
            y: state.cursor.y,
            username: state.cursor.username,
            color: state.cursor.color,
          });
        }
        if (state.liveStroke) {
          liveStrokes.push({ clientId, ...state.liveStroke });
        }
        if (state.liveShape) {
          liveShapes.push({ clientId, ...state.liveShape });
        }
        if (state.draggingShape) {
          draggingShapes.push({ clientId, ...state.draggingShape });
        }
      });
      setRemoteCursors(cursors);
      setRemoteLiveStrokes(liveStrokes);
      setRemoteLiveShapes(liveShapes);
      setRemoteDraggingShapes(draggingShapes);
    };
    awareness.on("change", handleAwarenessChange);
    handleAwarenessChange();
    return () => {
      if (awareness) {
        awareness.off("change", handleAwarenessChange);
        awareness.setLocalStateField("cursor", null);
        awareness.setLocalStateField("liveStroke", null);
        awareness.setLocalStateField("liveShape", null);
        awareness.setLocalStateField("draggingShape", null);
      }
      setRemoteCursors([]);
      setRemoteLiveStrokes([]);
      setRemoteLiveShapes([]);
      setRemoteDraggingShapes([]);
    };
  }, [awareness, doc]);

  return {
    userCursorColor,
    remoteCursors,
    remoteLiveStrokes,
    remoteLiveShapes,
    remoteDraggingShapes,
    updateLocalCursor,
    updateLiveStroke,
    updateLiveShape,
    updateDraggingShape,
  };
};