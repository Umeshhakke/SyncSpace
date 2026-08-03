import {
    Grid3X3,
    Crosshair,
    Monitor,
    Undo2,
    Redo2,
    ArrowUp,
    ArrowDown,
    ArrowUpToLine,
    ArrowDownToLine,
    Download,
    Upload,
    FilePlus,
    FileJson,
    Image,
    MoreHorizontal,
    PenTool,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useWhiteboard } from "./context/WhiteboardContext";
import { useWorkspace } from "../../context/WorkspaceContext";

function WhiteboardHeader() {
    const {
        zoom,
        setZoom,
        setOffset,
        showGrid,
        setShowGrid,
        undo,
        redo,
        canUndo,
        canRedo,
        objects,
        setObjects,
        pushHistory,
        resetHistory,
        bringForward,
        sendBackward,
        bringToFront,
        sendToBack,
        selectedObjectId,
    } = useWhiteboard();
    const { connectionStatus, awarenessStates, awareness } = useWorkspace();

    const drawingUsers = (awarenessStates || [])
        .filter((state) => state.clientId !== awareness?.clientID && state.whiteboardDrawing)
        .map((state) => state.user?.name || state.username)
        .filter(Boolean);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const resetView = () => {
        setZoom(100);
        setOffset({ x: 0, y: 0 });
    };

    const toggleGrid = () => setShowGrid(prev => !prev);

    // Export JSON
    const exportJSON = () => {
        const data = JSON.stringify(objects, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "whiteboard.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import JSON
    const importJSON = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    setObjects(data);
                    pushHistory(data);
                }
            } catch (err) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    };

    // New board
    const newBoard = () => {
        if (objects.length > 0 && !confirm("Clear all objects?")) return;
        setObjects([]);
        resetHistory();
        pushHistory([]);
    };

    // Export PNG
    const exportPNG = () => {
        const svg = document.querySelector("svg");
        if (!svg) return;
        const canvas = document.createElement("canvas");
        const rect = svg.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext("2d");
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const pngUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = "whiteboard.png";
            a.click();
        };
        img.src = url;
    };

    // Export SVG
    const exportSVG = () => {
        const svg = document.querySelector("svg");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "whiteboard.svg";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Menu items for the dropdown (layers + file ops)
    const menuItems = (
        <>
            {selectedObjectId && (
                <>
                    <button onClick={bringForward} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left">
                        <ArrowUp size={16} /> Bring Forward
                    </button>
                    <button onClick={sendBackward} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left">
                        <ArrowDown size={16} /> Send Backward
                    </button>
                    <button onClick={bringToFront} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left">
                        <ArrowUpToLine size={16} /> Bring to Front
                    </button>
                    <button onClick={sendToBack} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left">
                        <ArrowDownToLine size={16} /> Send to Back
                    </button>
                    <hr className="my-1" />
                </>
            )}
            <button onClick={newBoard} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left">
                <FilePlus size={16} /> New Board
            </button>
            <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left">
                <FileJson size={16} /> Export JSON
            </button>
            <label className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left cursor-pointer">
                <Upload size={16} /> Import JSON
                <input type="file" accept=".json" onChange={importJSON} className="hidden" />
            </label>
            <button onClick={exportPNG} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left">
                <Image size={16} /> Export PNG
            </button>
            <button onClick={exportSVG} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left">
                <Download size={16} /> Export SVG
            </button>
        </>
    );

    return (
        <div className="flex items-center justify-between border-b border-slate-200 px-2 md:px-5 py-2 md:py-4">
            <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-semibold text-slate-800 truncate">Whiteboard</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {connectionStatus || "Connecting"}
                </span>
                {drawingUsers.length > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 flex items-center gap-1">
                        <PenTool size={12} />
                        {drawingUsers.length === 1 ? `${drawingUsers[0]} is drawing` : `${drawingUsers.length} people are drawing`}
                    </span>
                )}
            </div>
 
                <div className="flex items-center gap-1 md:gap-4 relative flex-nowrap min-w-0">
                {/* Undo/Redo – always visible */}
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`rounded-md p-1 md:p-2 transition ${
                        canUndo ? "hover:bg-slate-100" : "opacity-40 cursor-not-allowed"
                    }`}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`rounded-md p-1 md:p-2 transition ${
                        canRedo ? "hover:bg-slate-100" : "opacity-40 cursor-not-allowed"
                    }`}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>

                <div className="w-px h-6 bg-slate-200 hidden sm:block" />

                {/* Zoom percentage – always visible */}
                <button
                    onClick={resetView}
                    className="text-xs md:text-sm font-medium text-slate-700 hover:text-blue-600 transition"
                    title="Reset view (100%)"
                >
                    {Math.round(zoom)}%
                </button>

                {/* Grid toggle – always visible (but can be hidden on very small if needed) */}
                <button
                    onClick={toggleGrid}
                    className={`rounded-md p-1 md:p-2 transition hover:bg-slate-100 ${
                        showGrid ? "bg-blue-100 text-blue-600" : "text-slate-600"
                    }`}
                    title="Toggle grid"
                >
                    <Grid3X3 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>

                {/* Fullscreen – always visible (but can be hidden on very small if needed) */}
                <button
                    onClick={() => {
                        if (!document.fullscreenElement) {
                            document.documentElement.requestFullscreen?.();
                        } else {
                            document.exitFullscreen?.();
                        }
                    }}
                    className="rounded-md p-1 md:p-2 transition hover:bg-slate-100"
                    title="Fullscreen"
                >
                    <Monitor size={16} className="md:w-[18px] md:h-[18px]" />
                </button>

                <div className="w-px h-6 bg-slate-200 hidden md:block" />

                {/* Desktop: layer & file controls – visible on medium screens and up */}
                <div className="hidden md:flex items-center gap-1 md:gap-4">
                    {selectedObjectId && (
                        <>
                            <button onClick={bringForward} className="rounded-md p-1 md:p-2 hover:bg-slate-100" title="Bring Forward">
                                <ArrowUp size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                            <button onClick={sendBackward} className="rounded-md p-1 md:p-2 hover:bg-slate-100" title="Send Backward">
                                <ArrowDown size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                            <button onClick={bringToFront} className="rounded-md p-1 md:p-2 hover:bg-slate-100" title="Bring to Front">
                                <ArrowUpToLine size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                            <button onClick={sendToBack} className="rounded-md p-1 md:p-2 hover:bg-slate-100" title="Send to Back">
                                <ArrowDownToLine size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                            <div className="w-px h-6 bg-slate-200" />
                        </>
                    )}
                    <button onClick={newBoard} className="rounded-md p-1 md:p-2 hover:bg-slate-100" title="New Board">
                        <FilePlus size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <button onClick={exportJSON} className="rounded-md p-1 md:p-2 hover:bg-slate-100" title="Export JSON">
                        <FileJson size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <label className="rounded-md p-1 md:p-2 hover:bg-slate-100 cursor-pointer" title="Import JSON">
                        <Upload size={16} className="md:w-[18px] md:h-[18px]" />
                        <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                    </label>
                    <button onClick={exportPNG} className="rounded-md p-1 md:p-2 hover:bg-slate-100" title="Export PNG">
                        <Image size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <button onClick={exportSVG} className="rounded-md p-1 md:p-2 hover:bg-slate-100" title="Export SVG">
                        <Download size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                </div>

                {/* Mobile: More dropdown – visible on smaller than medium screens */}
                <div className="md:hidden relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="rounded-md p-1 md:p-2 hover:bg-slate-100"
                        title="More options"
                    >
                        <MoreHorizontal size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-[70vh] overflow-y-auto">
                            {menuItems}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WhiteboardHeader;