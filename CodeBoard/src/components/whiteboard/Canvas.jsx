import { useState, useRef, useEffect, useCallback } from "react";
import { useWhiteboard } from "./context/WhiteboardContext";
import { useWorkspace } from "../../context/WorkspaceContext";

function Canvas() {
    const {
        activeTool,
        objects,
        setObjects,
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
        fillColor,
        strokeWidth,
        opacity,
        isDashed,
        fontFamily,
        isBold,
        isItalic,
        isUnderline,
        zoom,
        setZoom,          // was missing
        offset,
        showGrid,
        pushHistory,
        clipboard,
        setClipboard,
        undo,
        redo,
        setCursorPosition,
    } = useWhiteboard();
    const { awarenessStates, setAwarenessField, awareness, doc } = useWorkspace();

    const updateWhiteboardDraft = useCallback(
        (draft) => {
            if (!setAwarenessField) return;
            if (draft) {
                setAwarenessField("whiteboardDraft", draft);
            } else {
                setAwarenessField("whiteboardDraft", null);
            }
        },
        [setAwarenessField]
    );

    const resizeStartData = useRef(null);
    const [editingText, setEditingText] = useState(null);
    const textInputRef = useRef(null);
    const blurTimeoutRef = useRef(null);
    const initialFocusDoneRef = useRef(false);
    const [isErasing, setIsErasing] = useState(false);
    const lastCursorUpdateRef = useRef(0);

    useEffect(() => {
        if (!setAwarenessField) return;
        if (editingText) {
            updateWhiteboardDraft(editingText);
        } else if (!currentDrawing && !isDragging && !isResizing) {
            updateWhiteboardDraft(null);
        }
    }, [editingText, currentDrawing, isDragging, isResizing, setAwarenessField, updateWhiteboardDraft]);

    // Helper: update objects and push history
    const updateObjectsAndHistory = (newObjectsOrUpdater) => {
        const newObjects = typeof newObjectsOrUpdater === 'function'
            ? newObjectsOrUpdater(objects)
            : newObjectsOrUpdater;
        if (!newObjects) return;
        pushHistory(newObjects);
    };

    // Keyboard shortcuts (delete, copy, paste, duplicate, undo/redo)
    useEffect(() => {
        function handleKeyDown(e) {
            if (editingText) return;

            if ((e.key === "Delete" || e.key === "Backspace") && selectedObjectId) {
                e.preventDefault();
                updateObjectsAndHistory(prev => prev.filter(obj => obj.id !== selectedObjectId));
                setSelectedObjectId(null);
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedObjectId) {
                e.preventDefault();
                const obj = objects.find(o => o.id === selectedObjectId);
                if (obj) setClipboard({ ...obj });
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
                e.preventDefault();
                const newObj = {
                    ...clipboard,
                    id: Date.now() + Math.random(),
                    x: clipboard.x + 20,
                    y: clipboard.y + 20,
                };
                updateObjectsAndHistory(prev => [...prev, newObj]);
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedObjectId) {
                e.preventDefault();
                const obj = objects.find(o => o.id === selectedObjectId);
                if (obj) {
                    const newObj = {
                        ...obj,
                        id: Date.now() + Math.random(),
                        x: obj.x + 20,
                        y: obj.y + 20,
                    };
                    updateObjectsAndHistory(prev => [...prev, newObj]);
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                redo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
                return;
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [editingText, selectedObjectId, objects, clipboard, setClipboard, undo, redo]);

    // Mouse wheel zoom
    useEffect(() => {
        function handleWheel(e) {
            if (editingText) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -10 : 10;
            setZoom(prev => Math.min(500, Math.max(10, prev + delta)));
        }
        const svg = document.querySelector("svg");
        if (svg) {
            svg.addEventListener("wheel", handleWheel, { passive: false });
            return () => svg.removeEventListener("wheel", handleWheel);
        }
    }, [editingText, setZoom]);

    // Focus input on text edit
    useEffect(() => {
        if (editingText && textInputRef.current) {
            setTimeout(() => {
                if (textInputRef.current) {
                    textInputRef.current.focus();
                }
            }, 50);
            initialFocusDoneRef.current = false;
        }
    }, [editingText]);

    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
        };
    }, []);

    // Helper: get mouse position relative to SVG
    function getMousePosition(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    // Helper: arrowhead
    function getArrowhead(fromX, fromY, toX, toY, headLength = 12, headAngle = 0.5) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const p1 = { x: toX - headLength * Math.cos(angle - headAngle), y: toY - headLength * Math.sin(angle - headAngle) };
        const p2 = { x: toX - headLength * Math.cos(angle + headAngle), y: toY - headLength * Math.sin(angle + headAngle) };
        return [p1, p2];
    }

    function distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const cx = x1 + t * dx, cy = y1 + t * dy;
        return Math.hypot(px - cx, py - cy);
    }

    function getArrowHandles(object, x, y) {
        const size = 12;
        const handles = {
            start: { x: object.startX - size/2, y: object.startY - size/2 },
            end: { x: object.endX - size/2, y: object.endY - size/2 },
        };
        for (const key in handles) {
            const h = handles[key];
            if (x >= h.x && x <= h.x + size && y >= h.y && y <= h.y + size) return key;
        }
        return null;
    }

    function getResizeHandle(object, x, y) {
        if (object.type === "pen") return null;
        if (object.type === "arrow") return getArrowHandles(object, x, y);
        const handleSize = 10, half = handleSize / 2;
        const handles = {
            tl: { x: object.x - half, y: object.y - half },
            tm: { x: object.x + object.width / 2 - half, y: object.y - half },
            tr: { x: object.x + object.width - half, y: object.y - half },
            ml: { x: object.x - half, y: object.y + object.height / 2 - half },
            mr: { x: object.x + object.width - half, y: object.y + object.height / 2 - half },
            bl: { x: object.x - half, y: object.y + object.height - half },
            bm: { x: object.x + object.width / 2 - half, y: object.y + object.height - half },
            br: { x: object.x + object.width - half, y: object.y + object.height - half },
        };
        for (const key in handles) {
            const h = handles[key];
            if (x >= h.x && x <= h.x + handleSize && y >= h.y && y <= h.y + handleSize) return key;
        }
        return null;
    }

    function getCursorStyle(handle) {
        const cursors = {
            tl: 'nw-resize', tm: 'n-resize', tr: 'ne-resize',
            ml: 'w-resize', mr: 'e-resize',
            bl: 'sw-resize', bm: 's-resize', br: 'se-resize',
            start: 'grab', end: 'grab',
        };
        return cursors[handle] || 'default';
    }

    function pointsToPath(points) {
        if (!points || points.length === 0) return "";
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
        return d;
    }

    function getBoundingBox(points) {
        if (!points || points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    // Finish text input (apply current text styles)
    function finishText() {
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = null;
        }
        if (!editingText) return;
        const { x, y, text, color } = editingText;
        if (text && text.trim()) {
            const fontSize = 24;
            const width = text.length * fontSize * 0.6;
            const height = fontSize * 1.2;
            const newObject = {
                id: Date.now() + Math.random(),
                type: "text",
                x, y, width, height,
                text: text.trim(),
                color: color || "#000000",
                fontSize,
                fontFamily,
                isBold,
                isItalic,
                isUnderline,
                fillColor: "transparent",
                opacity: 1,
                strokeWidth: 0,
            };
            updateObjectsAndHistory(prev => [...prev, newObject]);
        }
        setEditingText(null);
        updateWhiteboardDraft(null);
    }

    // Find object under cursor
    function getObjectAt(x, y) {
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            if (obj.type === "arrow") {
                const dist = distToSegment(x, y, obj.startX, obj.startY, obj.endX, obj.endY);
                if (dist < 15) return obj;
            } else {
                if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
                    return obj;
                }
            }
        }
        return null;
    }

    // Eraser logic
    function isWithinEraserRadius(obj, x, y, radius) {
        if (!obj) return false;
        if (obj.type === "pen") {
            return obj.points.some((p) => Math.hypot(p.x - x, p.y - y) <= radius);
        }
        if (obj.type === "arrow") {
            return distToSegment(x, y, obj.startX, obj.startY, obj.endX, obj.endY) <= radius;
        }
        const left = obj.x;
        const top = obj.y;
        const right = obj.x + (obj.width || 0);
        const bottom = obj.y + (obj.height || 0);
        return x + radius >= left && x - radius <= right && y + radius >= top && y - radius <= bottom;
    }

    function applyEraser(x, y, radius) {
        let objectsUpdated = false;
        const newObjects = objects
            .map((obj) => {
                if (obj.type === "pen") {
                    const remainingPoints = obj.points.filter((p) => {
                        const dist = Math.hypot(p.x - x, p.y - y);
                        return dist > radius;
                    });
                    if (remainingPoints.length === obj.points.length) return obj;
                    objectsUpdated = true;
                    if (remainingPoints.length < 2) return null;
                    const bbox = getBoundingBox(remainingPoints);
                    return { ...obj, points: remainingPoints, x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
                }

                if (isWithinEraserRadius(obj, x, y, radius)) {
                    objectsUpdated = true;
                    return null;
                }

                return obj;
            })
            .filter((obj) => obj !== null);

        if (objectsUpdated) {
            if (selectedObjectId && !newObjects.some((obj) => obj.id === selectedObjectId)) {
                setSelectedObjectId(null);
            }
            setObjects(newObjects);
        }
    }

    // Mouse events
    function handleMouseDown(event) {
        if (editingText) { finishText(); return; }
        const { x, y } = getMousePosition(event);

        if (activeTool === "eraser") {
            const obj = getObjectAt(x, y);
            if (obj && obj.type !== "pen") {
                updateObjectsAndHistory(prev => prev.filter(o => o.id !== obj.id));
                if (selectedObjectId === obj.id) setSelectedObjectId(null);
            }
            setIsErasing(true);
            const radius = Math.max(5, strokeWidth * 2);
            applyEraser(x, y, radius);
            return;
        }

        if (activeTool === "select") {
            const clickedObject = getObjectAt(x, y);
            if (clickedObject) {
                const handle = getResizeHandle(clickedObject, x, y);
                if (handle) {
                    setSelectedObjectId(clickedObject.id);
                    setResizeHandle(handle);
                    setIsResizing(true);
                    resizeStartData.current = {
                        id: clickedObject.id,
                        startX: clickedObject.x,
                        startY: clickedObject.y,
                        startWidth: clickedObject.width,
                        startHeight: clickedObject.height,
                        startFontSize: clickedObject.fontSize || 24,
                    };
                    return;
                }
                setSelectedObjectId(clickedObject.id);
                setIsDragging(true);
                if (clickedObject.type === "arrow") {
                    setDragOffset({ x: x - clickedObject.startX, y: y - clickedObject.startY });
                } else {
                    setDragOffset({ x: x - clickedObject.x, y: y - clickedObject.y });
                }
            } else {
                setSelectedObjectId(null);
            }
            return;
        }

        // Drawing tools (pass current styles)
        const commonProps = { color, strokeWidth, fillColor, opacity, isDashed };
        if (activeTool === "rectangle") {
            const draft = {
                id: Date.now() + Math.random(),
                type: "rectangle",
                startX: x, startY: y, x, y,
                width: 0, height: 0,
                ...commonProps,
            };
            setCurrentDrawing(draft);
            updateWhiteboardDraft(draft);
            return;
        }
        if (activeTool === "circle") {
            const draft = {
                id: Date.now() + Math.random(),
                type: "circle",
                startX: x, startY: y, x, y,
                width: 0, height: 0,
                ...commonProps,
            };
            setCurrentDrawing(draft);
            updateWhiteboardDraft(draft);
            return;
        }
        if (activeTool === "pen") {
            const draft = {
                id: Date.now() + Math.random(),
                type: "pen",
                points: [{ x, y }],
                color, strokeWidth,
                x, y,
                width: 0, height: 0,
            };
            setCurrentDrawing(draft);
            updateWhiteboardDraft(draft);
            return;
        }
        if (activeTool === "arrow") {
            const draft = {
                id: Date.now() + Math.random(),
                type: "arrow",
                startX: x, startY: y,
                endX: x, endY: y,
                color, strokeWidth,
                x, y,
                width: 0, height: 0,
            };
            setCurrentDrawing(draft);
            updateWhiteboardDraft(draft);
            return;
        }
        if (activeTool === "text") {
            const draft = { x, y, text: "", color: color || "#000000", fontFamily, isBold, isItalic, isUnderline, type: "text" };
            setEditingText(draft);
            updateWhiteboardDraft(draft);
        }
    }

    const updateRemoteCursor = useCallback((x, y) => {
        if (!setAwarenessField) return;
        const now = Date.now();
        if (now - lastCursorUpdateRef.current < 50) return;
        lastCursorUpdateRef.current = now;
        setAwarenessField("boardCursor", { x: Math.round(x), y: Math.round(y) });
    }, [setAwarenessField]);

    function handleMouseMove(event) {
        const { x, y } = getMousePosition(event);
        setCursorPosition({ x: Math.round(x), y: Math.round(y) });
        updateRemoteCursor(x, y);
        if (activeTool === "eraser" && isErasing) {
            const radius = Math.max(5, strokeWidth * 2);
            applyEraser(x, y, radius);
            return;
        }
        if (editingText) return;

        if (activeTool === "select" && isResizing && selectedObjectId && resizeHandle) {
            const obj = objects.find(o => o.id === selectedObjectId);
            if (!obj) return;
            const MIN = 10;
            const startData = resizeStartData.current;
            if (!startData) return;
            let newX = obj.x, newY = obj.y, newW = obj.width, newH = obj.height;
            switch (resizeHandle) {
                case 'tl': newX = Math.min(x, obj.x + obj.width - MIN); newY = Math.min(y, obj.y + obj.height - MIN); newW = obj.x + obj.width - newX; newH = obj.y + obj.height - newY; break;
                case 'tm': newY = Math.min(y, obj.y + obj.height - MIN); newH = obj.y + obj.height - newY; break;
                case 'tr': newY = Math.min(y, obj.y + obj.height - MIN); newW = Math.max(MIN, x - obj.x); newH = obj.y + obj.height - newY; break;
                case 'ml': newX = Math.min(x, obj.x + obj.width - MIN); newW = obj.x + obj.width - newX; break;
                case 'mr': newW = Math.max(MIN, x - obj.x); break;
                case 'bl': newX = Math.min(x, obj.x + obj.width - MIN); newW = obj.x + obj.width - newX; newH = Math.max(MIN, y - obj.y); break;
                case 'bm': newH = Math.max(MIN, y - obj.y); break;
                case 'br': newW = Math.max(MIN, x - obj.x); newH = Math.max(MIN, y - obj.y); break;
                default: return;
            }
            let newFontSize = obj.fontSize;
            if (obj.type === "text" && startData.startHeight > 0) {
                const heightRatio = newH / startData.startHeight;
                newFontSize = Math.max(6, Math.round(startData.startFontSize * heightRatio));
            }
            setObjects(prev => prev.map(o => {
                if (o.id !== selectedObjectId) return o;
                const updated = { ...o, x: newX, y: newY, width: newW, height: newH };
                if (obj.type === "text") updated.fontSize = newFontSize;
                return updated;
            }));
            return;
        }

        if (activeTool === "select" && isDragging && selectedObjectId) {
            const obj = objects.find(o => o.id === selectedObjectId);
            if (!obj) return;
            if (obj.type === "arrow") {
                const dx = x - dragOffset.x - obj.startX;
                const dy = y - dragOffset.y - obj.startY;
                const newStartX = obj.startX + dx, newStartY = obj.startY + dy;
                const newEndX = obj.endX + dx, newEndY = obj.endY + dy;
                setObjects(prev => prev.map(o => {
                    if (o.id !== selectedObjectId) return o;
                    const minX = Math.min(newStartX, newEndX);
                    const minY = Math.min(newStartY, newEndY);
                    const maxX = Math.max(newStartX, newEndX);
                    const maxY = Math.max(newStartY, newEndY);
                    return { ...o, startX: newStartX, startY: newStartY, endX: newEndX, endY: newEndY, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                }));
            } else {
                setObjects(prev => prev.map(o => o.id === selectedObjectId ? { ...o, x: x - dragOffset.x, y: y - dragOffset.y } : o));
            }
            return;
        }

        if (!currentDrawing) return;
        const { type } = currentDrawing;
        if (type === "rectangle" || type === "circle") {
            const left = Math.min(currentDrawing.startX, x);
            const top = Math.min(currentDrawing.startY, y);
            const width = Math.abs(x - currentDrawing.startX);
            const height = Math.abs(y - currentDrawing.startY);
            const updated = { ...currentDrawing, x: left, y: top, width, height };
            setCurrentDrawing(updated);
            updateWhiteboardDraft(updated);
        } else if (type === "pen") {
            const newPoints = [...currentDrawing.points, { x, y }];
            const bbox = getBoundingBox(newPoints);
            const updated = { ...currentDrawing, points: newPoints, x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
            setCurrentDrawing(updated);
            updateWhiteboardDraft(updated);
        } else if (type === "arrow") {
            const minX = Math.min(currentDrawing.startX, x);
            const minY = Math.min(currentDrawing.startY, y);
            const maxX = Math.max(currentDrawing.startX, x);
            const maxY = Math.max(currentDrawing.startY, y);
            const updated = { ...currentDrawing, endX: x, endY: y, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
            setCurrentDrawing(updated);
            updateWhiteboardDraft(updated);
        }
    }

    function handleMouseUp() {
        if (activeTool === "eraser" && isErasing) {
            setIsErasing(false);
            return;
        }
        if (editingText) return;
        if (isDragging) {
            setIsDragging(false);
            pushHistory(objects);
            return;
        }
        if (isResizing) {
            setIsResizing(false);
            setResizeHandle(null);
            resizeStartData.current = null;
            pushHistory(objects);
            return;
        }
        if (!currentDrawing) return;
        const { type } = currentDrawing;
        if ((type === "rectangle" || type === "circle") && (currentDrawing.width < 2 || currentDrawing.height < 2)) {
            setCurrentDrawing(null); return;
        }
        if (type === "pen" && (!currentDrawing.points || currentDrawing.points.length < 2)) {
            setCurrentDrawing(null); return;
        }
        if (type === "arrow") {
            const dx = currentDrawing.endX - currentDrawing.startX;
            const dy = currentDrawing.endY - currentDrawing.startY;
            if (Math.hypot(dx, dy) < 5) {
                setCurrentDrawing(null);
                updateWhiteboardDraft(null);
                return;
            }
        }
        updateObjectsAndHistory(prev => [...prev, currentDrawing]);
        setCurrentDrawing(null);
        updateWhiteboardDraft(null);
    }

    function handleMouseLeave() {
        if (editingText) return;
        if (isErasing) {
            setIsErasing(false);
        }
        if (currentDrawing && currentDrawing.type === "pen") {
            if (currentDrawing.points && currentDrawing.points.length >= 2) {
                updateObjectsAndHistory(prev => [...prev, currentDrawing]);
            }
            setCurrentDrawing(null);
        }
        if (isDragging) {
            setIsDragging(false);
            pushHistory(objects);
        }
        if (isResizing) {
            setIsResizing(false);
            setResizeHandle(null);
            resizeStartData.current = null;
            pushHistory(objects);
        }

        updateWhiteboardDraft(null);
    }

    // Rendering helpers (with full styling)
    function renderObject(obj) {
        const isSelected = obj.id === selectedObjectId;
        const objFill = isSelected ? "rgba(37,99,235,.25)" : (obj.fillColor || fillColor);
        const objStroke = isSelected ? "#1d4ed8" : (obj.color || color);
        const objStrokeWidth = isSelected ? 3 : (obj.strokeWidth || strokeWidth);
        const objOpacity = obj.opacity !== undefined ? obj.opacity : opacity;
        const dashArray = (obj.isDashed || isDashed) ? "6 4" : "none";

        const commonProps = {
            stroke: objStroke,
            strokeWidth: objStrokeWidth,
            strokeDasharray: dashArray,
            opacity: objOpacity,
        };

        if (obj.type === "rectangle") {
            return <rect key={obj.id} x={obj.x} y={obj.y} width={obj.width} height={obj.height} fill={objFill} {...commonProps} />;
        } else if (obj.type === "circle") {
            const cx = obj.x + obj.width / 2, cy = obj.y + obj.height / 2;
            const rx = obj.width / 2, ry = obj.height / 2;
            return <ellipse key={obj.id} cx={cx} cy={cy} rx={rx} ry={ry} fill={objFill} {...commonProps} />;
        } else if (obj.type === "pen") {
            const d = pointsToPath(obj.points);
            return <path key={obj.id} d={d} fill="none" {...commonProps} strokeLinecap="round" strokeLinejoin="round" />;
        } else if (obj.type === "arrow") {
            const [p1, p2] = getArrowhead(obj.startX, obj.startY, obj.endX, obj.endY);
            const line = <line key={obj.id+"-line"} x1={obj.startX} y1={obj.startY} x2={obj.endX} y2={obj.endY} {...commonProps} />;
            const arrowPoly = <polygon key={obj.id+"-head"} points={`${obj.endX},${obj.endY} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill={objStroke} opacity={objOpacity} />;
            const selectionRect = isSelected ? <rect key={obj.id+"-sel"} x={obj.x-5} y={obj.y-5} width={obj.width+10} height={obj.height+10} fill="rgba(37,99,235,.1)" stroke="#2563eb" strokeWidth="1" strokeDasharray="4 4" /> : null;
            return <g key={obj.id}>{selectionRect}{line}{arrowPoly}</g>;
        } else if (obj.type === "text") {
            const textStyle = {
                fill: obj.color || "#000000",
                fontSize: obj.fontSize || 24,
                fontFamily: obj.fontFamily || fontFamily,
                fontWeight: obj.isBold ? "bold" : "normal",
                fontStyle: obj.isItalic ? "italic" : "normal",
                textDecoration: obj.isUnderline ? "underline" : "none",
                opacity: objOpacity,
            };
            const textEl = <text key={obj.id} x={obj.x} y={obj.y + (obj.fontSize || 24)} {...textStyle}>{obj.text}</text>;
            const box = isSelected ? <rect key={obj.id+"-box"} x={obj.x-4} y={obj.y-4} width={obj.width+8} height={obj.height+8} fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="4 4" /> : null;
            return <g key={obj.id}>{box}{textEl}</g>;
        }
        return null;
    }

    function renderHandles(obj) {
        if (obj.id !== selectedObjectId) return null;
        if (obj.type === "pen") return null;
        if (obj.type === "arrow") {
            const hs = 10;
            return (
                <>
                    <rect x={obj.startX - hs/2} y={obj.startY - hs/2} width={hs} height={hs} fill="white" stroke="#2563eb" strokeWidth="2" cursor="grab" />
                    <rect x={obj.endX - hs/2} y={obj.endY - hs/2} width={hs} height={hs} fill="white" stroke="#2563eb" strokeWidth="2" cursor="grab" />
                </>
            );
        }
        const positions = [
            { x: obj.x - 5, y: obj.y - 5 },
            { x: obj.x + obj.width / 2 - 5, y: obj.y - 5 },
            { x: obj.x + obj.width - 5, y: obj.y - 5 },
            { x: obj.x - 5, y: obj.y + obj.height / 2 - 5 },
            { x: obj.x + obj.width - 5, y: obj.y + obj.height / 2 - 5 },
            { x: obj.x - 5, y: obj.y + obj.height - 5 },
            { x: obj.x + obj.width / 2 - 5, y: obj.y + obj.height - 5 },
            { x: obj.x + obj.width - 5, y: obj.y + obj.height - 5 },
        ];
        return positions.map((pos, idx) => <rect key={idx} x={pos.x} y={pos.y} width="10" height="10" fill="white" stroke="#2563eb" strokeWidth="2" />);
    }

    function renderPreview() {
        if (!currentDrawing) return null;
        const { type, x, y, width, height, points, color: c, strokeWidth: sw, startX, startY, endX, endY } = currentDrawing;
        const common = {
            stroke: c || color,
            strokeWidth: sw || strokeWidth,
            strokeDasharray: "6 4",
            opacity: 0.7,
        };
        if (type === "rectangle") {
            return <rect x={x} y={y} width={width} height={height} fill="rgba(59,130,246,.15)" {...common} />;
        } else if (type === "circle") {
            const cx = x + width/2, cy = y + height/2;
            return <ellipse cx={cx} cy={cy} rx={width/2} ry={height/2} fill="rgba(59,130,246,.15)" {...common} />;
        } else if (type === "pen") {
            if (!points || points.length < 2) return null;
            const d = pointsToPath(points);
            return <path d={d} fill="none" {...common} strokeLinecap="round" strokeLinejoin="round" />;
        } else if (type === "arrow") {
            const [p1, p2] = getArrowhead(startX, startY, endX, endY);
            return (
                <g opacity="0.7">
                    <line x1={startX} y1={startY} x2={endX} y2={endY} {...common} />
                    <polygon points={`${endX},${endY} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill={c || color} />
                </g>
            );
        }
        return null;
    }

    function renderRemoteDrafts() {
        if (!awarenessStates || !awarenessStates.length) return null;
        return awarenessStates
            .filter((state) => state.clientId !== doc?.clientID && state.user && state.whiteboardDraft)
            .map((state) => {
                const draft = state.whiteboardDraft;
                const previewColor = draft.color || state.user?.color || "#7c3aed";
                const common = {
                    stroke: previewColor,
                    strokeWidth: draft.strokeWidth || 2,
                    strokeDasharray: draft.type === "pen" ? "none" : "6 4",
                    opacity: 0.55,
                };
                if (draft.type === "rectangle") {
                    return (
                        <g key={`remote-draft-${state.clientId}`}>
                            <rect x={draft.x} y={draft.y} width={draft.width} height={draft.height} fill="rgba(59,130,246,.12)" {...common} />
                        </g>
                    );
                }
                if (draft.type === "circle") {
                    const cx = draft.x + draft.width / 2;
                    const cy = draft.y + draft.height / 2;
                    return (
                        <g key={`remote-draft-${state.clientId}`}>
                            <ellipse cx={cx} cy={cy} rx={draft.width / 2} ry={draft.height / 2} fill="rgba(59,130,246,.12)" {...common} />
                        </g>
                    );
                }
                if (draft.type === "pen") {
                    const d = pointsToPath(draft.points || []);
                    return (
                        <g key={`remote-draft-${state.clientId}`}>
                            <path d={d} fill="none" {...common} strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    );
                }
                if (draft.type === "arrow") {
                    const [p1, p2] = getArrowhead(draft.startX, draft.startY, draft.endX, draft.endY);
                    return (
                        <g key={`remote-draft-${state.clientId}`}>
                            <line x1={draft.startX} y1={draft.startY} x2={draft.endX} y2={draft.endY} {...common} />
                            <polygon points={`${draft.endX},${draft.endY} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill={previewColor} opacity="0.75" />
                        </g>
                    );
                }
                if (draft.type === "text") {
                    return (
                        <g key={`remote-draft-${state.clientId}`}>
                            <text x={draft.x} y={draft.y + (draft.fontSize || 24)} fill={previewColor} fontSize={draft.fontSize || 24} fontFamily={draft.fontFamily || fontFamily} opacity="0.75">
                                {draft.text}
                            </text>
                        </g>
                    );
                }
                return null;
            });
    }

    function renderRemoteCursors() {
        if (!awarenessStates || !awarenessStates.length) return null;
        return awarenessStates
            .filter((state) => state.clientId !== doc?.clientID && state.user && state.boardCursor)
            .map((state) => (
                <g key={`remote-cursor-${state.clientId}`}>
                    <circle
                        cx={state.boardCursor.x}
                        cy={state.boardCursor.y}
                        r={8}
                        fill={state.user.color || "#7c3aed"}
                        opacity="0.85"
                    />
                    <text
                        x={state.boardCursor.x + 12}
                        y={state.boardCursor.y + 4}
                        fill={state.user.color || "#0f172a"}
                        fontSize="12"
                        fontWeight="700"
                    >
                        {state.user.name}
                    </text>
                </g>
            ));
    }

    // Render
    return (
        <div className="absolute inset-0 overflow-hidden bg-slate-50">
            <svg
                className="h-full w-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{
                    cursor: (() => {
                        if (editingText) return 'text';
                        if (isResizing && resizeHandle) return getCursorStyle(resizeHandle);
                        if (activeTool === "select") return 'default';
                        if (activeTool === "eraser") return 'crosshair';
                        if (activeTool === "text") return 'text';
                        return 'crosshair';
                    })(),
                }}
            >
                <defs>
                    <pattern id="smallGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                        <path d="M25 0H0V25" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    </pattern>
                </defs>

                <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom / 100})`}>
                    {renderRemoteCursors()}
                    {renderRemoteDrafts()}
                    {showGrid && <rect width="10000" height="10000" fill="url(#smallGrid)" />}
                    {objects.map((obj) => (
                        <g key={obj.id}>
                            {renderObject(obj)}
                            {renderHandles(obj)}
                        </g>
                    ))}
                    {renderPreview()}
                </g>
            </svg>

            {/* Text input overlay */}
            {editingText && (
                <div
                    style={{
                        position: 'absolute',
                        left: editingText.x,
                        top: editingText.y - 12,
                        zIndex: 50,
                        pointerEvents: 'auto',
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <input
                        ref={textInputRef}
                        type="text"
                        placeholder="Type text..."
                        value={editingText.text}
                        onChange={(e) => setEditingText(prev => ({ ...prev, text: e.target.value }))}
                        style={{
                            fontSize: '24px',
                            fontFamily: 'sans-serif',
                            color: editingText.color || '#000000',
                            background: 'transparent',
                            border: 'none',
                            outline: '2px solid #2563eb',
                            outlineOffset: '2px',
                            padding: '2px 4px',
                            margin: 0,
                            minWidth: '100px',
                        }}
                        onFocus={(e) => {
                            if (!initialFocusDoneRef.current) {
                                e.target.select();
                                initialFocusDoneRef.current = true;
                            }
                            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                                finishText();
                            }
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                                setEditingText(null);
                            }
                        }}
                        onBlur={() => {
                            blurTimeoutRef.current = setTimeout(() => finishText(), 800);
                        }}
                    />
                </div>
            )}

            {objects.length === 0 && !currentDrawing && !editingText && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold text-slate-300">Whiteboard</h1>
                        <p className="mt-3 text-lg text-slate-400">Infinite Canvas</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Canvas;