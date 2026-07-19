import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Stage, Layer, Line, Circle, Text, Label, Tag } from "react-konva";
import Toolbar from "./Toolbar";
import RoomPanel from "./RoomPanel";
import useCanvas from "../../hooks/useCanvas";
import socketService from "../../services/socketService";
import useYjs from "../../hooks/useYjs";

const Whiteboard = ({ roomId, username }) => {
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  
  const stageRef = useRef(null);

  // Room & socket connection states
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [roomUsers, setRoomUsers] = useState([]);
  const [notification, setNotification] = useState(null);

  // Initialize the Yjs collaboration hook when a user joins a room
  const { doc, provider, awareness, shapesArray } = useYjs(roomId);

  // ---------- YJS DELETE SHAPE ----------
  const deleteShapeFromYjs = useCallback((shapeId) => {
    if (!shapesArray) return;

    // Find the index of the shape with matching ID
    const index = shapesArray.toArray().findIndex(shape => shape.id === shapeId);
    
    if (index !== -1) {
      // Delete the shape from the Yjs array
      shapesArray.delete(index, 1);
      console.log(`🗑️ Deleted shape ${shapeId} from Yjs`);
    }
  }, [shapesArray]);

  // ---------- YJS ADD SHAPE ----------
  const addShapeToYjs = useCallback((shapeData) => {
    if (!shapesArray) return;

    // Check if shape already exists (avoid duplicates)
    const exists = shapesArray.toArray().some(shape => shape.id === shapeData.id);
    
    if (!exists && shapeData.id) {
      // Convert local shape format to Yjs shape format
      const yjsShape = {
        id: shapeData.id,
        type: shapeData.tool || "pen",
        stroke: shapeData.color || "#000000",
        strokeWidth: shapeData.size || 5,
        points: shapeData.points || [],
        createdBy: username || "anonymous",
        timestamp: Date.now(),
      };
      
      shapesArray.push([yjsShape]);
      console.log(`🔄 Re-added shape ${shapeData.id} to Yjs (redo)`);
    }
  }, [shapesArray, username]);

  // ---------- USE CANVAS HOOK (with Yjs integration) ----------
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

  // Cache of synchronized shape IDs to prevent duplicate network syncs
  const syncedIdsRef = useRef(new Set());

  // Clear synchronization cache when room or shapesArray changes
  useEffect(() => {
    syncedIdsRef.current.clear();
  }, [shapesArray]);

  // Generate a random cursor color once per session
  const userCursorColor = useMemo(() => {
    const colors = [
      "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
      "#2196f3", "#00bcd4", "#009688", "#4caf50",
      "#ff9800", "#ff5722", "#795548", "#607d8b"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // State to hold remote users' cursor presence data
  const [remoteCursors, setRemoteCursors] = useState([]);

  // Ref to track last cursor update timestamp for throttling
  const lastCursorUpdateRef = useRef(0);

  // Callback to update the local user's presence state in Yjs Awareness
  const updateLocalCursor = useCallback((x, y) => {
    if (!awareness) return;

    const now = Date.now();
    // Throttle cursor updates to 50ms intervals
    if (now - lastCursorUpdateRef.current < 50) return;
    lastCursorUpdateRef.current = now;

    awareness.setLocalStateField("cursor", {
      x,
      y,
      username: username || "anonymous",
      color: userCursorColor,
    });
  }, [awareness, username, userCursorColor]);

  // Effect to listen to remote users' cursor updates
  useEffect(() => {
    if (!awareness) {
      setRemoteCursors([]);
      return;
    }

    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const cursors = [];

      states.forEach((state, clientId) => {
        // Do not render the local user's own cursor
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
    // Initial fetch of active cursors
    handleAwarenessChange();

    return () => {
      if (awareness) {
        awareness.off("change", handleAwarenessChange);
        // Clear the local cursor presence when leaving the room
        awareness.setLocalStateField("cursor", null);
      }
      setRemoteCursors([]);
    };
  }, [awareness, doc]);

  // ---------- SYNC REMOTE SHAPES FROM YJS TO LOCAL CANVAS ----------
  useEffect(() => {
    if (!shapesArray) return;

    const handleObserve = (event) => {
      // Ignore local updates to prevent infinite synchronization loops
      if (event.transaction.local) return;

      let hasDeletion = false;

      event.delta.forEach((op) => {
        // ---------- Handle INSERTIONS ----------
        if (op.insert) {
          const inserted = Array.isArray(op.insert) ? op.insert : [op.insert];
          inserted.forEach((shape) => {
            // Add remote shape ID to synced cache
            syncedIdsRef.current.add(shape.id);

            // Convert the Yjs object format to local shape format
            const remoteLine = {
              id: shape.id,
              tool: shape.type,
              color: shape.stroke,
              size: shape.strokeWidth,
              points: shape.points || [],
              globalCompositeOperation:
                shape.type === "eraser" ? "destination-out" : "source-over",
            };

            // Append remote shape to existing lines, preventing duplicate rendering
            setLines((prev) => {
              const alreadyExists = prev.some((line) => line.id === shape.id);
              if (alreadyExists) {
                return prev;
              }
              return [...prev, remoteLine];
            });
          });
        }

        // ---------- Handle DELETIONS ----------
        if (op.delete) {
          hasDeletion = true;
        }
      });

      // If any deletion happened, synchronize local lines with Yjs array
      if (hasDeletion) {
        // Get all IDs currently present in the shared array
        const remoteIds = new Set(shapesArray.toArray().map((shape) => shape.id));

        setLines((prev) => {
          // Keep only lines that either have no ID (local unsynced) or whose ID still exists in remote
          return prev.filter((line) => !line.id || remoteIds.has(line.id));
        });
      }
    };

    // Listen to changes on shapesArray
    shapesArray.observe(handleObserve);

    // Clean up observer when the component unmounts or room changes
    return () => {
      shapesArray.unobserve(handleObserve);
    };
  }, [shapesArray, setLines]);

  // ---------- SYNC LOCAL SHAPES TO YJS ----------
  useEffect(() => {
    if (!shapesArray || lines.length === 0) return;

    // Identify unsynced lines (lines that have no ID or are not in the sync cache)
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
      const localLine = updatedLines[idx];
      // Reuse existing ID if it exists, otherwise generate a unique one
      const uniqueId = localLine.id || `shape-${username || "anonymous"}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Map the local line format to the Yjs shared shape schema
      const yjsShape = {
        id: uniqueId,
        type: localLine.tool || "pen",
        stroke: localLine.color || "#000000",
        strokeWidth: localLine.size || 5,
        points: localLine.points || [],
        createdBy: username || "anonymous",
        timestamp: Date.now(),
        x: 0,
        y: 0,
      };

      shapesToPush.push(yjsShape);
      // Register in sync cache immediately to block concurrent duplicates
      syncedIdsRef.current.add(uniqueId);

      // Update the local line with the generated unique ID
      updatedLines[idx] = {
        ...localLine,
        id: uniqueId,
      };
    });

    // Update lines state to contain the generated IDs
    setLines(updatedLines);

    // Push the new shapes to the shared Yjs array
    if (shapesToPush.length > 0) {
      shapesArray.push(shapesToPush);
    }
  }, [lines, shapesArray, username, setLines]);

  // Helper function to display custom toast messages
  const showToast = (message, type = "info") => {
    setNotification({ message, type });
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000);
    return timer;
  };

  // Listen to socket connection and user events
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

    const handleUsersUpdated = (usersList) => {
      setRoomUsers(usersList);
    };

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

  // Handler for leaving a room
  const handleLeave = () => {
    if (roomId) {
      socketService.leaveRoom(roomId);
      socketService.disconnect();
      showToast("Successfully left the room.", "info");
    }
  };

  // Handle window resize for responsive canvas
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

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    const newLine = {
      tool: tool,
      color: tool === "eraser" ? "#ffffff" : color,
      size: tool === "eraser" ? brushSize * 2 : brushSize,
      points: [pos.x, pos.y],
      globalCompositeOperation:
        tool === "eraser" ? "destination-out" : "source-over",
    };
    startDrawing(newLine);
  };

  const handleMouseMove = (e) => {
    const pos = e.target.getStage().getPointerPosition();

    // Draw locally if mouse button is down
    if (isDrawing) {
      draw(pos.x, pos.y);
    }

    // Share cursor position to remote users
    if (awareness && username) {
      updateLocalCursor(pos.x, pos.y);
    }
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      stopDrawing();
    }
    // Remove cursor representation on remote screens when local user leaves stage area
    if (awareness) {
      awareness.setLocalStateField("cursor", null);
    }
  };

  return (
    <div className="whiteboard-wrapper">
      {notification && (
        <div className={`toast toast-${notification.type}`}>
          {notification.message}
        </div>
      )}
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
      />
      <div className="whiteboard-main-layout">
        <div className="canvas-container">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ backgroundColor: "#ffffff", cursor: "crosshair" }}
          >
            <Layer>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.size}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    line.globalCompositeOperation || "source-over"
                  }
                  hitStrokeWidth={0}
                  listening={false}
                />
              ))}
            </Layer>
            {/* Dedicated Layer for rendering remote users' cursors */}
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
        />
      </div>
    </div>
  );
};

export default Whiteboard;