import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Stage, Layer, Line, Circle, Text, Label, Tag, Rect, Transformer } from "react-konva";
import Toolbar from "./Toolbar";
import RoomPanel from "./RoomPanel";
import useCanvas from "../../hooks/useCanvas";
import socketService from "../../services/socketService";
import useYjs from "../../hooks/useYjs";

const Whiteboard = ({ roomId, username, isDarkMode }) => {
  // ---------- Tool state ----------
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#FF6B6B");
  const [brushSize, setBrushSize] = useState(5);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  // ---------- Refs ----------
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const dragStartRef = useRef({});

  // ---------- Shape drawing state ----------
  const [startPoint, setStartPoint] = useState(null);
  const [previewShape, setPreviewShape] = useState(null);

  // ---------- Selection state ----------
  const [selectedId, setSelectedId] = useState(null);

  // ---------- Room & socket states ----------
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [roomUsers, setRoomUsers] = useState([]);
  const [notification, setNotification] = useState(null);

  // ---------- Yjs ----------
  const { doc, provider, awareness, shapesArray } = useYjs(roomId);

  // ---------- Yjs delete / add ----------
  const deleteShapeFromYjs = useCallback((shapeId) => {
    if (!shapesArray) return;
    const index = shapesArray.toArray().findIndex(shape => shape.id === shapeId);
    if (index !== -1) {
      shapesArray.delete(index, 1);
      console.log(`🗑️ Deleted shape ${shapeId} from Yjs`);
    }
  }, [shapesArray]);

  const addShapeToYjs = useCallback((shapeData) => {
    if (!shapesArray) return;
    const exists = shapesArray.toArray().some(shape => shape.id === shapeData.id);
    if (!exists && shapeData.id) {
      shapesArray.push([shapeData]);
      console.log(`🔄 Re-added shape ${shapeData.id} to Yjs (redo)`);
    }
  }, [shapesArray]);

  // ---------- useCanvas hook ----------
  const {
    lines,
    redoStack,
    isDrawing,
    setIsDrawing,
    startDrawing,
    draw,
    stopDrawing,
    undo,
    redo,
    clearCanvas,
    setLines,
    setRedoStack,
  } = useCanvas(deleteShapeFromYjs, addShapeToYjs);

  // ---------- Sync cache ----------
  const syncedIdsRef = useRef(new Set());
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    syncedIdsRef.current.clear();
  }, [shapesArray]);

  // ---------- User cursor color ----------
  const userCursorColor = useMemo(() => {
    const colors = [
      "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
      "#2196f3", "#00bcd4", "#009688", "#4caf50",
      "#ff9800", "#ff5722", "#795548", "#607d8b"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // ---------- Remote cursors ----------
  const [remoteCursors, setRemoteCursors] = useState([]);
  const lastCursorUpdateRef = useRef(0);

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

  useEffect(() => {
    if (!awareness) {
      setRemoteCursors([]);
      return;
    }
    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const cursors = [];
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
      });
      setRemoteCursors(cursors);
    };
    awareness.on("change", handleAwarenessChange);
    handleAwarenessChange();
    return () => {
      if (awareness) {
        awareness.off("change", handleAwarenessChange);
        awareness.setLocalStateField("cursor", null);
      }
      setRemoteCursors([]);
    };
  }, [awareness, doc]);

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
  }, [shapesArray, setLines, selectedId]);

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

  // ---------- Toast helper ----------
  const showToast = (message, type = "info") => {
    setNotification({ message, type });
    const timer = setTimeout(() => setNotification(null), 3000);
    return timer;
  };

  // ---------- Socket listeners ----------
  useEffect(() => {
    let toastTimer;
    const handleConnect = () => {
      setConnectionStatus("connected");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = showToast("Successfully joined the room!", "success");
    };
    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      setRoomUsers([]);
    };
    const handleConnectError = () => {
      setConnectionStatus("disconnected");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = showToast("Connection failed.", "error");
    };
    const handleUsersUpdated = (usersList) => setRoomUsers(usersList);
    socketService.on("connect", handleConnect);
    socketService.on("disconnect", handleDisconnect);
    socketService.on("connect_error", handleConnectError);
    socketService.on("room-users-updated", handleUsersUpdated);
    return () => {
      socketService.off("connect", handleConnect);
      socketService.off("disconnect", handleDisconnect);
      socketService.off("connect_error", handleConnectError);
      socketService.off("room-users-updated", handleUsersUpdated);
      socketService.disconnect();
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, []);

  const handleLeave = () => {
    if (roomId) {
      socketService.leaveRoom(roomId);
      socketService.disconnect();
      showToast("Successfully left the room.", "info");
    }
  };

  // ---------- Resize handler ----------
  useEffect(() => {
    const handleResize = () => {
      const container = document.querySelector(".canvas-container");
      if (container) {
        const rect = container.getBoundingClientRect();
        setStageSize({
          width: rect.width - 4,
          height: rect.height - 4,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------- Transformer effect ----------
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  // ---------- Shape creation helper ----------
  const createShapeObject = (type, startX, startY, endX, endY) => {
    const id = `shape-${username || "anonymous"}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      type,
      startX,
      startY,
      endX,
      endY,
      color: tool === "eraser" ? "#ffffff" : color,
      strokeWidth: tool === "eraser" ? brushSize * 2 : brushSize,
      createdBy: username || "anonymous",
      timestamp: Date.now(),
    };
  };

  // ---------- Mouse handlers ----------
  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    if (tool === "select") {
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
      }
      return;
    }

    const isShapeTool = ["rectangle", "circle", "triangle", "line"].includes(tool);

    if (isShapeTool) {
      setStartPoint({ x: pos.x, y: pos.y });
      setIsDrawing(true);
      setPreviewShape(null);
      return;
    }

    const newLine = {
      type: "freehand",
      tool: tool,
      color: tool === "eraser" ? "#ffffff" : color,
      size: tool === "eraser" ? brushSize * 2 : brushSize,
      points: [pos.x, pos.y],
      globalCompositeOperation: tool === "eraser" ? "destination-out" : "source-over",
    };
    startDrawing(newLine);
  };

  const handleMouseMove = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    const isShapeTool = ["rectangle", "circle", "triangle", "line"].includes(tool);

    if (isShapeTool && isDrawing && startPoint) {
      const shape = createShapeObject(tool, startPoint.x, startPoint.y, pos.x, pos.y);
      setPreviewShape(shape);
      return;
    }

    if (isDrawing) {
      draw(pos.x, pos.y);
    }

    if (awareness && username && tool !== "select") {
      updateLocalCursor(pos.x, pos.y);
    }
  };

  const handleMouseUp = (e) => {
    const isShapeTool = ["rectangle", "circle", "triangle", "line"].includes(tool);

    if (isShapeTool && isDrawing && startPoint) {
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) {
        setIsDrawing(false);
        setStartPoint(null);
        setPreviewShape(null);
        return;
      }
      const shape = createShapeObject(tool, startPoint.x, startPoint.y, pos.x, pos.y);
      setLines((prev) => [...prev, shape]);
      setIsDrawing(false);
      setStartPoint(null);
      setPreviewShape(null);
      return;
    }

    stopDrawing();
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      if (["rectangle", "circle", "triangle", "line"].includes(tool)) {
        setIsDrawing(false);
        setStartPoint(null);
        setPreviewShape(null);
      } else {
        stopDrawing();
      }
    }
    if (awareness) {
      awareness.setLocalStateField("cursor", null);
    }
  };

  // ---------- Render item ----------
  const renderDrawing = (item, index) => {
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
          // strokeWidth={item.size}
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
          onDragEnd={(e) => {
            if (!isSelectable) return;
            const node = e.target;
            const startData = dragStartRef.current[item.id];
            if (!startData) return;
            
            const dx = node.x() - startData.initialX;
            const dy = node.y() - startData.initialY;
            
            if (dx === 0 && dy === 0) {
              delete dragStartRef.current[item.id];
              return;
            }
            
            const newPoints = startData.originalPoints.map((p, i) => {
              return i % 2 === 0 ? p + dx : p + dy;
            });
            
            const updatedItem = { ...item, points: newPoints };
            setLines((prev) => prev.map((l) => (l.id === item.id ? updatedItem : l)));
            
            // Reset node position to (0,0) after updating internal data
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
      onDragEnd: (e) => {
        if (tool !== "select") return;
        const node = e.target;
        const startData = dragStartRef.current[id];
        if (!startData) return;
        
        const dx = node.x() - startData.initialX;
        const dy = node.y() - startData.initialY;
        
        if (dx === 0 && dy === 0) {
          delete dragStartRef.current[id];
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
        
        // Reset node position to (0,0) after updating internal data
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

  // ---------- Render ----------
  return (
    <div
      className="whiteboard-wrapper"
      style={{
        background: isDarkMode ? "#0d1117" : "#ffffff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        undo={undo}
        redo={redo}
        clearCanvas={clearCanvas}
        canUndo={lines.length > 0}
        canRedo={redoStack.length > 0}
        isDarkMode={isDarkMode}
      />
      <div className="whiteboard-main-layout" style={{ flex: 1, position: "relative" }}>
        <div className="canvas-container" style={{ width: "100%", height: "100%" }}>
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              backgroundColor: isDarkMode ? "#0d1117" : "#ffffff",
              cursor: tool === "select" ? "default" : "crosshair",
              display: "block",
            }}
          >
            <Layer>
              {lines.map((item, i) => renderDrawing(item, i))}
              {previewShape && renderDrawing(previewShape, "preview")}
            </Layer>
            <Layer>
              <Transformer
                ref={transformerRef}
                borderColor="#4dabf7"
                anchorStrokeColor="#4dabf7"
                anchorFillColor="#ffffff"
                anchorSize={8}
                rotateEnabled={false}
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              />
            </Layer>
            <Layer>
              {remoteCursors.map((cursor) => (
                <React.Fragment key={cursor.clientId}>
                  <Circle
                    x={cursor.x}
                    y={cursor.y}
                    radius={5}
                    fill={cursor.color}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    shadowColor="black"
                    shadowBlur={3}
                    shadowOpacity={0.25}
                    listening={false}
                  />
                  <Label x={cursor.x + 8} y={cursor.y + 8} listening={false}>
                    <Tag
                      fill={cursor.color}
                      pointerDirection="left"
                      pointerWidth={6}
                      pointerHeight={6}
                      lineJoin="round"
                      cornerRadius={4}
                      shadowColor="black"
                      shadowBlur={2}
                      shadowOpacity={0.15}
                    />
                    <Text
                      text={cursor.username}
                      fontFamily="sans-serif"
                      fontSize={10}
                      fontStyle="bold"
                      padding={4}
                      fill="#ffffff"
                    />
                  </Label>
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        </div>
        <RoomPanel
          connectionStatus={connectionStatus}
          isJoined={!!roomId && !!username}
          currentRoomId={roomId}
          currentUsername={username}
          users={roomUsers}
          currentSocketId={socketService.socket?.id}
          onLeave={handleLeave}
          isDarkMode={isDarkMode}
        />
      </div>
      {notification && (
        <div
          className={`toast toast-${notification.type}`}
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: notification.type === "error" ? "#e74c3c" : "#2ecc71",
            color: "white",
            padding: "0.5rem 1.5rem",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default Whiteboard;