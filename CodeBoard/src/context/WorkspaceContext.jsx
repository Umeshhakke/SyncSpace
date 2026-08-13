import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import useYjs from "../hooks/useYjs";
import socketService from "../services/socketService";

const WorkspaceContext = createContext(null);
const USERNAME_STORAGE_KEY = "codeboard-username";

function getSavedUsername() {
    if (typeof window === "undefined") return "Guest";
    const stored = window.localStorage.getItem(USERNAME_STORAGE_KEY);
    if (stored) return stored;
    const generated = `User-${Math.floor(1000 + Math.random() * 9000)}`;
    window.localStorage.setItem(USERNAME_STORAGE_KEY, generated);
    return generated;
}

function getUserColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 68%, 55%)`;
}

export function WorkspaceProvider({ roomId, username: initialUsername, children }) {
    const username = useMemo(() => initialUsername || getSavedUsername(), [initialUsername]);
    const userColor = useMemo(() => getUserColor(username), [username]);
    const {
        doc,
        provider,
        awareness,
        shapesArray,
        codeText,
        synced,
    } = useYjs(roomId);

    const [participants, setParticipants] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [awarenessStates, setAwarenessStates] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("Connecting");

    const addNotification = useCallback((message) => {
        const id = `${Date.now()}-${Math.random()}`;
        setNotifications((prev) => [...prev, { id, message }]);
        window.setTimeout(() => {
            setNotifications((prev) => prev.filter((item) => item.id !== id));
        }, 5000);
    }, []);

    useEffect(() => {
        if (!provider) return;

        const handleStatus = (evt) => {
            const status = evt?.status || evt;
            if (status === "connected") {
                setConnectionStatus("Connected");
            } else if (status === "disconnected") {
                setConnectionStatus("Disconnected");
            } else {
                setConnectionStatus("Reconnecting");
            }
        };

        const handleSync = (isSynced) => {
            setConnectionStatus(isSynced ? "Connected" : "Connecting");
        };

        provider.on("status", handleStatus);
        provider.on("sync", handleSync);

        return () => {
            provider.off("status", handleStatus);
            provider.off("sync", handleSync);
        };
    }, [provider]);

    useEffect(() => {
        if (!awareness) return;

        const updateAwareness = () => {
            const states = Array.from(awareness.getStates().entries()).map(([clientId, state]) => ({
                clientId,
                ...state,
            }));
            setAwarenessStates(states);
        };

        updateAwareness();
        awareness.on("change", updateAwareness);

        return () => {
            awareness.off("change", updateAwareness);
        };
    }, [awareness]);

    useEffect(() => {
        if (awarenessStates.length === 0) return;

        const users = awarenessStates
            .filter((state) => state.user)
            .map((state) => ({
                clientId: state.clientId,
                name: state.user.name,
                color: state.user.color,
                username: state.user.name,
            }));

        setParticipants(users);
    }, [awarenessStates]);

    useEffect(() => {
        if (!roomId) return;

        socketService.connect();

        const handleParticipants = ({ participants: roomParticipants }) => {
            setParticipants(
                roomParticipants.map((participant) => ({
                    ...participant,
                    color: getUserColor(participant.username),
                }))
            );
        };

        const handleUserJoined = ({ message }) => {
            addNotification(message);
        };

        const handleUserLeft = ({ message }) => {
            addNotification(message);
        };

        const handleConnect = () => {
            setConnectionStatus("Connected");
            // Re-join the room after a socket reconnect so the server
            // restores presence tracking without requiring a page reload.
            socketService.joinRoom(roomId, username);
        };

        const handleDisconnect = () => {
            setConnectionStatus("Disconnected");
        };

        socketService.on("room:participants", handleParticipants);
        socketService.on("user-joined", handleUserJoined);
        socketService.on("user-left", handleUserLeft);
        socketService.on("connect", handleConnect);
        socketService.on("disconnect", handleDisconnect);

        // Initial join
        socketService.joinRoom(roomId, username);

        return () => {
            socketService.off("room:participants", handleParticipants);
            socketService.off("user-joined", handleUserJoined);
            socketService.off("user-left", handleUserLeft);
            socketService.off("connect", handleConnect);
            socketService.off("disconnect", handleDisconnect);
            // leaveRoom no longer needs a roomId argument
            socketService.leaveRoom();
        };
    }, [roomId, username, addNotification]);

    useEffect(() => {
        if (!awareness) return;

        awareness.setLocalState({
            user: { name: username, color: userColor },
            username,
            color: userColor,
            roomId,
        });

        return () => {
            if (!awareness) return;
            awareness.setLocalState(null);
        };
    }, [awareness, username, userColor, roomId]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!username) return;
        window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
    }, [username]);

    const setAwarenessField = useCallback(
        (key, value) => {
            if (!awareness) return;
            awareness.setLocalStateField(key, value);
        },
        [awareness]
    );

    const leaveRoom = useCallback(() => {
        try {
            socketService.leaveRoom();
            if (provider && typeof provider.disconnect === "function") {
                provider.disconnect();
            }
        } catch (e) {
            console.error("Error leaving room:", e);
        }
    }, [provider]);

    const value = useMemo(
        () => ({
            roomId,
            username,
            userColor,
            doc,
            provider,
            awareness,
            shapesArray,
            codeText,
            synced,
            connectionStatus,
            participants,
            notifications,
            awarenessStates,
            addNotification,
            setAwarenessField,
            leaveRoom,
        }),
        [
            roomId,
            username,
            userColor,
            doc,
            provider,
            awareness,
            shapesArray,
            codeText,
            synced,
            connectionStatus,
            participants,
            notifications,
            awarenessStates,
            addNotification,
            setAwarenessField,
            leaveRoom,
        ]
    );

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used inside WorkspaceProvider.");
    }
    return context;
}
