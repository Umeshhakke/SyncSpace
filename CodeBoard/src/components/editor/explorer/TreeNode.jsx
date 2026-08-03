import { useEffect, useRef, useState, useCallback } from "react";
import {
    ChevronDown,
    ChevronRight,
    File,
    FileCode2,
    FileJson,
    FileText,
    Folder,
    FolderOpen,
    FilePlus,
    FolderPlus,
    Trash2,
    Pencil,
} from "lucide-react";

const iconMap = {
    javascript: FileCode2,
    typescript: FileCode2,
    json: FileJson,
    html: FileCode2,
    css: FileCode2,
    markdown: FileText,
    python: FileCode2,
    java: FileCode2,
    cpp: FileCode2,
    plaintext: File,
};

function TreeNode({
    node,
    depth = 0,
    selectedFileId,
    selectedFolderId,
    selectedNodeId,
    activeCreateType,
    pendingName,
    onOpenFile,
    onSelectFolder,
    onSelectNode,
    onRename,
    onDelete,
    onCreateFile,
    onCreateFolder,
    onCreateInputChange,
    onCreateSubmit,
    onCreateCancel,
}) {
    const [isExpanded, setIsExpanded] = useState(node.type === "folder" && depth === 0);
    const [contextOpen, setContextOpen] = useState(false);
    const [contextPosition, setContextPosition] = useState({ top: 0, left: 0 });
    // VS Code-style inline rename state
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(node.name);

    const menuRef = useRef(null);
    const renameInputRef = useRef(null);

    const isNodeSelected = node.id === selectedNodeId;
    const isFolderSelected = node.type === "folder" && node.id === selectedFolderId;
    const Icon = node.type === "folder" ? null : iconMap[node.language] || File;

    // Auto-expand when this folder is targeted for creation
    useEffect(() => {
        if (isFolderSelected && activeCreateType && !isExpanded) {
            setIsExpanded(true);
        }
    }, [isFolderSelected, activeCreateType, isExpanded]);

    // Close context menu on outside click
    useEffect(() => {
        if (!contextOpen) return;
        const handler = (e) => {
            if (!menuRef.current?.contains(e.target)) setContextOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [contextOpen]);

    // Focus the rename input when renaming starts
    useEffect(() => {
        if (isRenaming) {
            // Select all text so user can immediately type the new name
            setTimeout(() => {
                renameInputRef.current?.focus();
                renameInputRef.current?.select();
            }, 0);
        }
    }, [isRenaming]);

    // Keep renameValue in sync when the node name changes externally (e.g. from peers)
    useEffect(() => {
        if (!isRenaming) setRenameValue(node.name);
    }, [node.name, isRenaming]);

    const startRename = useCallback(() => {
        setContextOpen(false);
        setRenameValue(node.name);
        setIsRenaming(true);
    }, [node.name]);

    const commitRename = useCallback(() => {
        const trimmed = renameValue.trim();
        setIsRenaming(false);
        if (trimmed && trimmed !== node.name) {
            onRename(node.id, trimmed);
        }
    }, [renameValue, node.id, node.name, onRename]);

    const cancelRename = useCallback(() => {
        setIsRenaming(false);
        setRenameValue(node.name);
    }, [node.name]);

    const handleRenameKeyDown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); commitRename(); }
        if (e.key === "Escape") { e.preventDefault(); cancelRename(); }
    };

    const handleNodeClick = (e) => {
        e.stopPropagation();
        if (node.type === "folder") {
            setIsExpanded((prev) => !prev);
            onSelectFolder(node.id);
            onSelectNode(node.id, "folder");
        } else {
            onSelectNode(node.id, "file");
            onOpenFile(node.id);
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextOpen(true);
        setContextPosition({ top: e.clientY, left: e.clientX });
        onSelectNode(node.id, node.type);
        if (node.type === "folder") onSelectFolder(node.id);
    };

    return (
        <div>
            {/* ── Node row ───────────────────────────────────────────────── */}
            <div
                role="button"
                tabIndex={0}
                onClick={handleNodeClick}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNodeClick(e); }}
                onContextMenu={handleContextMenu}
                onDoubleClick={(e) => { e.stopPropagation(); startRename(); }}
                className={`group relative flex w-full items-center gap-1.5 rounded-md py-1.5 pr-1 text-left transition select-none cursor-pointer ${
                    isNodeSelected
                        ? "bg-slate-700/80 text-white"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {/* Chevron for folders */}
                <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center text-slate-500">
                    {node.type === "folder"
                        ? isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
                        : null}
                </span>

                {/* File/Folder icon */}
                <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center text-slate-400">
                    {node.type === "folder"
                        ? isExpanded ? <FolderOpen size={14} className="text-yellow-400/80" /> : <Folder size={14} className="text-yellow-400/80" />
                        : <Icon size={14} className="text-blue-400/80" />}
                </span>

                {/* Name — shows editable input when renaming */}
                {isRenaming ? (
                    <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={commitRename}
                        onClick={(e) => e.stopPropagation()}
                        className="min-w-0 flex-1 rounded bg-slate-600 px-1.5 py-0.5 text-sm text-white outline-none ring-1 ring-indigo-400"
                    />
                ) : (
                    <span className="min-w-0 flex-1 truncate text-sm">{node.name}</span>
                )}

                {/* Hover action buttons (VS Code style) */}
                {!isRenaming && (
                    <span className="ml-auto hidden shrink-0 items-center gap-0.5 group-hover:flex">
                        {node.type === "folder" && (
                            <>
                                <button
                                    type="button"
                                    title="New File"
                                    onClick={(e) => { e.stopPropagation(); onCreateFile(node.id); }}
                                    className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                                >
                                    <FilePlus size={13} />
                                </button>
                                <button
                                    type="button"
                                    title="New Folder"
                                    onClick={(e) => { e.stopPropagation(); onCreateFolder(node.id); }}
                                    className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                                >
                                    <FolderPlus size={13} />
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            title="Rename (F2)"
                            onClick={(e) => { e.stopPropagation(); startRename(); }}
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            type="button"
                            title="Delete"
                            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                            className="rounded p-0.5 text-slate-400 hover:bg-red-900/60 hover:text-red-300"
                        >
                            <Trash2 size={13} />
                        </button>
                    </span>
                )}
            </div>

            {/* ── Context menu ───────────────────────────────────────────── */}
            {contextOpen && (
                <div
                    ref={menuRef}
                    style={{ top: contextPosition.top, left: contextPosition.left, position: "fixed" }}
                    className="z-50 min-w-[170px] rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-2xl"
                >
                    {node.type === "folder" && (
                        <>
                            <button
                                type="button"
                                onClick={() => { setContextOpen(false); onCreateFile(node.id); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                            >
                                <FilePlus size={14} className="text-slate-400" /> New File
                            </button>
                            <button
                                type="button"
                                onClick={() => { setContextOpen(false); onCreateFolder(node.id); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                            >
                                <FolderPlus size={14} className="text-slate-400" /> New Folder
                            </button>
                            <div className="my-1 mx-2 h-px bg-slate-700" />
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => { setContextOpen(false); startRename(); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                    >
                        <Pencil size={14} className="text-slate-400" /> Rename
                        <span className="ml-auto text-xs text-slate-500">F2</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setContextOpen(false); onDelete(node.id); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-950/60 hover:text-red-300"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}

            {/* ── Children ───────────────────────────────────────────────── */}
            {node.type === "folder" && isExpanded && (
                <div>
                    {/* Inline input for creating inside THIS folder */}
                    {isFolderSelected && activeCreateType && (
                        <div style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }} className="py-1 pr-2">
                            <div className="flex items-center gap-1">
                                <input
                                    autoFocus
                                    type="text"
                                    value={pendingName}
                                    onChange={(e) => onCreateInputChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") { e.preventDefault(); onCreateSubmit(); }
                                        if (e.key === "Escape") { e.preventDefault(); onCreateCancel(); }
                                    }}
                                    placeholder={activeCreateType === "folder" ? "folder-name" : "file-name.js"}
                                    className="flex-1 rounded bg-slate-700 px-2 py-1 text-sm text-white outline-none ring-1 ring-indigo-400 placeholder:text-slate-500"
                                />
                                <button
                                    type="button"
                                    onClick={onCreateSubmit}
                                    className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500"
                                >✓</button>
                                <button
                                    type="button"
                                    onClick={onCreateCancel}
                                    className="rounded bg-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-500"
                                >✕</button>
                            </div>
                        </div>
                    )}

                    {node.children?.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedFileId={selectedFileId}
                            selectedFolderId={selectedFolderId}
                            selectedNodeId={selectedNodeId}
                            activeCreateType={activeCreateType}
                            pendingName={pendingName}
                            onOpenFile={onOpenFile}
                            onSelectFolder={onSelectFolder}
                            onSelectNode={onSelectNode}
                            onRename={onRename}
                            onDelete={onDelete}
                            onCreateFile={onCreateFile}
                            onCreateFolder={onCreateFolder}
                            onCreateInputChange={onCreateInputChange}
                            onCreateSubmit={onCreateSubmit}
                            onCreateCancel={onCreateCancel}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default TreeNode;
