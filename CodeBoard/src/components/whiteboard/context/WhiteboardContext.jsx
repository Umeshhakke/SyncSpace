import * as Y from "yjs";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useWorkspace } from "../../../context/WorkspaceContext";

const WhiteboardContext = createContext(null);
const MAX_HISTORY = 50;

export function WhiteboardProvider({ children }) {
    const { shapesArray, setAwarenessField, awareness } = useWorkspace();

    const [objects, setObjects] = useState([]);
    const [activeTool, setActiveTool] = useState("select");
    const [currentDrawing, setCurrentDrawing] = useState(null);
    const [selectedObjectId, setSelectedObjectId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [color, setColor] = useState("#2563eb");
    const [fillColor, setFillColor] = useState("rgba(59,130,246,.15)");
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [opacity, setOpacity] = useState(1);
    const [isDashed, setIsDashed] = useState(false);
    const [fontFamily, setFontFamily] = useState("sans-serif");
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [showGrid, setShowGrid] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const [clipboard, setClipboard] = useState(null);
    const [saveStatus, setSaveStatus] = useState("Saved");
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const undoManager = useMemo(() => {
        if (!shapesArray) return null;
        return new Y.UndoManager(shapesArray);
    }, [shapesArray]);

    useEffect(() => {
        if (!undoManager) return;
        setCanUndo(undoManager.canUndo());
        setCanRedo(undoManager.canRedo());
        return () => undoManager.destroy();
    }, [undoManager]);

    useEffect(() => {
        if (!shapesArray) {
            setObjects([]);
            return;
        }

        const updateObjects = () => setObjects(shapesArray.toArray());
        updateObjects();
        shapesArray.observe(updateObjects);
        return () => shapesArray.unobserve(updateObjects);
    }, [shapesArray]);

    useEffect(() => {
        if (!undoManager) return;
        setCanUndo(undoManager.canUndo());
        setCanRedo(undoManager.canRedo());
    }, [undoManager]);

    useEffect(() => {
        if (!setAwarenessField) return;
        setAwarenessField("selectedObjectId", selectedObjectId);
    }, [selectedObjectId, setAwarenessField]);

    useEffect(() => {
        if (!setAwarenessField) return;
        setAwarenessField("activeTool", activeTool);
    }, [activeTool, setAwarenessField]);

    useEffect(() => {
        if (!setAwarenessField) return;
        const isDrawingOrEditing = isDragging || isResizing || !!currentDrawing;
        setAwarenessField("editing", isDrawingOrEditing);
        setAwarenessField("whiteboardDrawing", isDrawingOrEditing);
    }, [isDragging, isResizing, currentDrawing, setAwarenessField]);

    const pushUndoState = useCallback(() => {
        setCanUndo(undoManager?.canUndo() ?? false);
        setCanRedo(undoManager?.canRedo() ?? false);
    }, [undoManager]);

    const updateShapeArray = useCallback(
        (updater) => {
            if (!shapesArray) return;
            const items = shapesArray.toArray();
            const nextObjects = typeof updater === "function" ? updater(items) : updater;
            if (nextObjects === undefined || nextObjects === null) return;
            shapesArray.delete(0, shapesArray.length);
            shapesArray.insert(0, nextObjects);
            pushUndoState();
        },
        [shapesArray, pushUndoState]
    );

    const pushHistory = useCallback(
        (newObjects) => {
            if (!shapesArray) return;
            if (newObjects === undefined || newObjects === null) return;
            shapesArray.delete(0, shapesArray.length);
            shapesArray.insert(0, newObjects);
            pushUndoState();
        },
        [shapesArray, pushUndoState]
    );

    const undo = useCallback(() => {
        if (!undoManager || !undoManager.canUndo()) return;
        undoManager.undo();
        pushUndoState();
    }, [undoManager, pushUndoState]);

    const redo = useCallback(() => {
        if (!undoManager || !undoManager.canRedo()) return;
        undoManager.redo();
        pushUndoState();
    }, [undoManager, pushUndoState]);

    const sharedInsert = useCallback(
        (shape) => {
            if (!shapesArray) return;
            shapesArray.insert(shapesArray.length, [shape]);
            pushUndoState();
        },
        [shapesArray, pushUndoState]
    );

    const updateObject = useCallback(
        (id, updater) => {
            if (!shapesArray) return;
            const items = shapesArray.toArray();
            const index = items.findIndex((item) => item.id === id);
            if (index === -1) return;
            const updatedItem = updater(items[index]);
            shapesArray.delete(index, 1);
            shapesArray.insert(index, [updatedItem]);
            pushUndoState();
        },
        [shapesArray, pushUndoState]
    );

    const removeObject = useCallback(
        (id) => {
            if (!shapesArray) return;
            const items = shapesArray.toArray();
            const index = items.findIndex((item) => item.id === id);
            if (index === -1) return;
            shapesArray.delete(index, 1);
            setSelectedObjectId((current) => (current === id ? null : current));
            pushUndoState();
        },
        [shapesArray, pushUndoState]
    );

    const moveShape = useCallback(
        (id, newIndex) => {
            if (!shapesArray) return;
            const items = shapesArray.toArray();
            const index = items.findIndex((item) => item.id === id);
            if (index === -1 || newIndex < 0 || newIndex >= items.length) return;
            const [item] = items.splice(index, 1);
            items.splice(newIndex, 0, item);
            shapesArray.delete(0, shapesArray.length);
            shapesArray.insert(0, items);
            pushUndoState();
        },
        [shapesArray, pushUndoState]
    );

    const bringForward = useCallback(() => {
        if (!selectedObjectId || !objects.length) return;
        const index = objects.findIndex((item) => item.id === selectedObjectId);
        if (index === -1 || index === objects.length - 1) return;
        moveShape(selectedObjectId, index + 1);
    }, [objects, selectedObjectId, moveShape]);

    const sendBackward = useCallback(() => {
        if (!selectedObjectId || !objects.length) return;
        const index = objects.findIndex((item) => item.id === selectedObjectId);
        if (index <= 0) return;
        moveShape(selectedObjectId, index - 1);
    }, [objects, selectedObjectId, moveShape]);

    const bringToFront = useCallback(() => {
        if (!selectedObjectId || !objects.length) return;
        const index = objects.findIndex((item) => item.id === selectedObjectId);
        if (index === -1 || index === objects.length - 1) return;
        moveShape(selectedObjectId, objects.length - 1);
    }, [objects, selectedObjectId, moveShape]);

    const sendToBack = useCallback(() => {
        if (!selectedObjectId || !objects.length) return;
        const index = objects.findIndex((item) => item.id === selectedObjectId);
        if (index <= 0) return;
        moveShape(selectedObjectId, 0);
    }, [objects, selectedObjectId, moveShape]);

    const resetHistory = useCallback(() => {
        if (!shapesArray) return;
        shapesArray.delete(0, shapesArray.length);
        setSelectedObjectId(null);
        pushUndoState();
    }, [shapesArray, pushUndoState]);

    const updateObjectProperties = useCallback(
        (id, props) => {
            updateObject(id, (item) => ({ ...item, ...props }));
        },
        [updateObject]
    );

    const value = {
        objects,
        setObjects: updateShapeArray,
        activeTool,
        setActiveTool,
        currentDrawing,
        setCurrentDrawing,
        selectedObjectId,
        setSelectedObjectId,
        isDragging,
        setIsDragging,
        dragOffset,
        setDragOffset,
        isResizing,
        setIsResizing,
        resizeHandle,
        setResizeHandle,
        color,
        setColor,
        fillColor,
        setFillColor,
        strokeWidth,
        setStrokeWidth,
        opacity,
        setOpacity,
        isDashed,
        setIsDashed,
        fontFamily,
        setFontFamily,
        isBold,
        setIsBold,
        isItalic,
        setIsItalic,
        isUnderline,
        setIsUnderline,
        zoom,
        setZoom,
        offset,
        setOffset,
        showGrid,
        setShowGrid,
        showOptions,
        setShowOptions,
        clipboard,
        setClipboard,
        undo,
        redo,
        canUndo,
        canRedo,
        pushHistory,
        resetHistory,
        bringForward,
        sendBackward,
        bringToFront,
        sendToBack,
        saveStatus,
        setSaveStatus,
        cursorPosition,
        setCursorPosition,
    };

    return <WhiteboardContext.Provider value={value}>{children}</WhiteboardContext.Provider>;
}

export function useWhiteboard() {
    const context = useContext(WhiteboardContext);
    if (!context) {
        throw new Error("useWhiteboard must be used inside WhiteboardProvider");
    }
    return context;
}
