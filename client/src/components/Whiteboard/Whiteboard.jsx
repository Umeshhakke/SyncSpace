import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Stage, Layer, Line, Circle, Text, Label, Tag } from "react-konva";
import Toolbar from "./Toolbar";
import RoomPanel from "./RoomPanel";
import CodeEditor from "../CodeEditor/CodeEditor";
import ChatBox from "../Chat/ChatBox";
import useCanvas from "../../hooks/useCanvas";
import socketService from "../../services/socketService";
import useYjs from "../../hooks/useYjs";

const Whiteboard = ({ initialTab = "whiteboard" }) => {
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const stageRef = useRef(null);

  // Active view tab state ("whiteboard" | "editor" | "split")
  const [activeTab, setActiveTab] = useState(initialTab);

  // Code Editor Dark/Light mode state
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Sync active tab with initialTab prop if it changes via routing
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
  const { doc, provider, awareness, shapesArray, metaMap, codeText, filesArray } = useYjs(currentRoomId);

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
      username: currentUsername || "anonymous",
      color: userCursorColor,
    });
  }, [awareness, currentUsername, userCursorColor]);

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

        if (state.cursor && state.cursor.x !== undefined && state.cursor.y !== undefined) {
          cursors.push({
            clientId,
            x: state.cursor.x,
            y: state.cursor.y,
            username: state.cursor.username || `User ${clientId}`,
            color: state.cursor.color || "#1976d2",
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

  // Dynamically calculate canvas container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      const container = document.querySelector(".canvas-container");
      if (container) {
        setStageSize({
          width: container.clientWidth || 800,
          height: container.clientHeight || 600,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [activeTab]);

  // Mouse event handlers
  const handleMouseDown = (e) => {
    startDrawing(e);
    if (e.target.getStage()) {
      const pos = e.target.getStage().getPointerPosition();
      if (pos) updateLocalCursor(pos.x, pos.y);
    }
  };

  const handleMouseMove = (e) => {
    draw(e);
    if (e.target.getStage()) {
      const pos = e.target.getStage().getPointerPosition();
      if (pos) updateLocalCursor(pos.x, pos.y);
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

      {/* Top Header & Toolbar with Workspace View Selector */}
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <div className="whiteboard-main-layout">
        {/* Whiteboard Canvas Container */}
        <div
          className="canvas-container"
          style={{
            display: activeTab === "whiteboard" || activeTab === "split" ? "block" : "none",
            flex: activeTab === "split" ? "1" : "1",
            height: "100%",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
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
                  {/* Visual cursor dot */}
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
                  {/* Premium floating label tooltips showing username */}
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

        {/* Integrated Monaco Code Editor Workspace */}
        <div
          className="editor-container"
          style={{
            display: activeTab === "editor" || activeTab === "split" ? "block" : "none",
            flex: activeTab === "split" ? "1" : "1",
            height: "100%",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <CodeEditor
            isDarkMode={isDarkMode}
            doc={doc}
            provider={provider}
            awareness={awareness}
            metaMap={metaMap}
            codeText={codeText}
            filesArray={filesArray}
            username={currentUsername || "Anonymous"}
            height="100%"
            width="100%"
          />
        </div>

        {/* Sidebar Container: RoomPanel & ChatBox */}
        <div className="sidebar-container">
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

          <ChatBox 
            username={currentUsername} 
            isDarkMode={isDarkMode} 
            roomId={currentRoomId} 
          />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;

