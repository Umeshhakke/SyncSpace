import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line } from "react-konva";
import Toolbar from "./Toolbar";
import RoomPanel from "./RoomPanel";
import useCanvas from "../../hooks/useCanvas";
import socketService from "../../services/socketService";
import useYjs from "../../hooks/useYjs";

const Whiteboard = () => {
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const stageRef = useRef(null);

  // Room & socket connection states
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [isJoined, setIsJoined] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [roomUsers, setRoomUsers] = useState([]);
  const [notification, setNotification] = useState(null);

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
  } = useCanvas();

  // Initialize the Yjs collaboration hook when a user joins a room
  const { doc, provider, awareness, shapesArray } = useYjs(currentRoomId);

  // Cache of synchronized shape IDs to prevent duplicate network syncs
  const syncedIdsRef = useRef(new Set());

  // Clear synchronization cache when room or shapesArray changes
  useEffect(() => {
    syncedIdsRef.current.clear();
  }, [shapesArray]);

  // Synchronize remote shapes from Yjs to local canvas state
  useEffect(() => {
    if (!shapesArray) return;

    const handleObserve = (event) => {
      // Ignore local updates to prevent infinite synchronization loops
      if (event.transaction.local) return;

      event.delta.forEach((op) => {
        if (op.insert) {
          // op.insert contains the inserted shape object(s)
          const inserted = Array.isArray(op.insert) ? op.insert : [op.insert];
          inserted.forEach((shape) => {
            // Add remote shape ID to synced cache to prevent re-syncing back
            syncedIdsRef.current.add(shape.id);

            // Convert the Yjs object format to Member 3's existing shape format
            const remoteLine = {
              id: shape.id,
              tool: shape.type,
              color: shape.stroke,
              size: shape.strokeWidth,
              points: shape.points,
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
      });
    };

    // Listen to changes on shapesArray
    shapesArray.observe(handleObserve);

    // Clean up observer when the component unmounts or room changes
    return () => {
      shapesArray.unobserve(handleObserve);
    };
  }, [shapesArray, setLines]);

  // Synchronize local shapes to Yjs when a drawing is completed
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
      const uniqueId = localLine.id || `shape-${currentUsername || "anonymous"}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Map the local line format to the Yjs shared shape schema
      const yjsShape = {
        id: uniqueId,
        type: localLine.tool,
        stroke: localLine.color,
        strokeWidth: localLine.size,
        points: localLine.points,
        createdBy: currentUsername || "anonymous",
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
    shapesArray.push(shapesToPush);
  }, [lines, shapesArray, currentUsername, setLines]);

  // Helper function to display custom toast messages
  const showToast = (message, type = "info") => {
    setNotification({ message, type });
    // Auto-dismiss the toast notification after 3 seconds
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
      setIsJoined(true);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = showToast("Successfully joined the room!", "success");
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      setIsJoined(false);
      setCurrentRoomId("");
      setCurrentUsername("");
      setRoomUsers([]);
    };

    const handleConnectError = () => {
      setConnectionStatus("disconnected");
      setIsJoined(false);
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

    // Clean up socket listeners and connection on unmount
    return () => {
      socketService.off("connect", handleConnect);
      socketService.off("disconnect", handleDisconnect);
      socketService.off("connect_error", handleConnectError);
      socketService.off("room-users-updated", handleUsersUpdated);
      socketService.disconnect();
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, []);

  // Handler for joining a room
  const handleJoin = (roomId, username) => {
    setConnectionStatus("connecting");
    setCurrentRoomId(roomId);
    setCurrentUsername(username);
    socketService.joinRoom(roomId, username);
  };

  // Handler for leaving a room
  const handleLeave = () => {
    if (currentRoomId) {
      socketService.leaveRoom(currentRoomId);
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
    if (!isDrawing) return;
    const pos = e.target.getStage().getPointerPosition();
    draw(pos.x, pos.y);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      stopDrawing();
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
          </Stage>
        </div>
        <RoomPanel
          connectionStatus={connectionStatus}
          isJoined={isJoined}
          currentRoomId={currentRoomId}
          currentUsername={currentUsername}
          users={roomUsers}
          currentSocketId={socketService.socket?.id}
          onJoin={handleJoin}
          onLeave={handleLeave}
        />
      </div>
    </div>
  );
};

export default Whiteboard;

