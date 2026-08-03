import { useMemo, useState, useCallback } from "react";

import { useProject } from "../context";
import ExplorerHeader from "./ExplorerHeader";
import ExplorerMenu from "./ExplorerMenu";
import SearchBox from "./SearchBox";
import TreeView from "./TreeView";

function ExplorerDrawer({ isOpen, onClose }) {
    const {
        fileTree,
        createFile,
        createFolder,
        openFile,
        activeFileId,
        renameNode,
        deleteNodeById,
    } = useProject();

    const [searchTerm, setSearchTerm] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    // activeCreateType: "file" | "folder" | null
    const [activeCreateType, setActiveCreateType] = useState(null);
    const [pendingName, setPendingName] = useState("");
    // Which folder the create action targets (null = root)
    const [createTargetFolderId, setCreateTargetFolderId] = useState(null);

    // For selection / context tracking
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedNodeType, setSelectedNodeType] = useState(null);
    const [selectedFolderId, setSelectedFolderId] = useState(null);

    // ── Search filter ─────────────────────────────────────────────────────────
    const filteredTree = useMemo(() => {
        if (!searchTerm.trim()) return fileTree;
        const query = searchTerm.toLowerCase();

        function filterNode(node) {
            const matches = node.name.toLowerCase().includes(query);
            if (node.type === "folder") {
                const filteredChildren = (node.children || []).map(filterNode).filter(Boolean);
                if (matches) return node;
                if (filteredChildren.length) return { ...node, children: filteredChildren };
                return null;
            }
            return matches ? node : null;
        }

        return fileTree.map(filterNode).filter(Boolean);
    }, [fileTree, searchTerm]);

    // ── Create helpers ────────────────────────────────────────────────────────

    /** Start a create-file flow targeting a specific folder (or root if null). */
    const startCreate = useCallback((type, folderId = null) => {
        setMenuOpen(false);
        setActiveCreateType(type);
        setCreateTargetFolderId(folderId);
        setPendingName(type === "folder" ? "New Folder" : "new-file.js");
    }, []);

    const handleSubmitCreate = useCallback(() => {
        const name = pendingName.trim();
        if (!name || !activeCreateType) {
            setActiveCreateType(null);
            setPendingName("");
            return;
        }

        if (activeCreateType === "file") createFile(createTargetFolderId, name);
        else if (activeCreateType === "folder") createFolder(createTargetFolderId, name);

        setActiveCreateType(null);
        setPendingName("");
        setCreateTargetFolderId(null);
    }, [pendingName, activeCreateType, createTargetFolderId, createFile, createFolder]);

    const handleCancelCreate = useCallback(() => {
        setActiveCreateType(null);
        setPendingName("");
        setCreateTargetFolderId(null);
    }, []);

    // ── Rename ────────────────────────────────────────────────────────────────
    // Called from TreeNode inline — nodeId and newName are explicit
    const handleRename = useCallback((nodeId, newName) => {
        if (!nodeId || !newName?.trim()) return;
        renameNode(nodeId, newName.trim());
    }, [renameNode]);

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = useCallback((nodeId) => {
        if (!nodeId) return;
        if (window.confirm("Delete this file or folder? This cannot be undone.")) {
            deleteNodeById(nodeId);
        }
    }, [deleteNodeById]);

    // ── Per-node create (triggered from hover buttons / context menu in TreeNode)
    // IMPORTANT: must also set selectedFolderId so TreeNode's isFolderSelected check passes
    const handleCreateFileInFolder = useCallback((folderId) => {
        setSelectedFolderId(folderId);
        setSelectedNodeId(folderId);
        setSelectedNodeType("folder");
        startCreate("file", folderId);
    }, [startCreate]);

    const handleCreateFolderInFolder = useCallback((folderId) => {
        setSelectedFolderId(folderId);
        setSelectedNodeId(folderId);
        setSelectedNodeType("folder");
        startCreate("folder", folderId);
    }, [startCreate]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-sm"
                    onClick={() => {
                        setMenuOpen(false);
                        handleCancelCreate();
                        onClose();
                    }}
                />
            )}

            <aside
                className={`absolute inset-y-0 left-0 z-30 flex w-[280px] max-w-full flex-col border-r border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                aria-hidden={!isOpen}
            >
                {/* Header with quick-action buttons */}
                <div className="relative flex-shrink-0">
                    <ExplorerHeader
                        onMenuToggle={() => setMenuOpen((prev) => !prev)}
                        onNewFile={() => startCreate("file", null)}
                        onNewFolder={() => startCreate("folder", null)}
                    />
                    <ExplorerMenu
                        open={menuOpen}
                        onNewFile={() => startCreate("file", null)}
                        onNewFolder={() => startCreate("folder", null)}
                        onRename={() => {
                            if (!selectedNodeId) return;
                            setMenuOpen(false);
                            // Find the current name for the prompt default
                            const findName = (nodes, id) => {
                                for (const n of nodes) {
                                    if (n.id === id) return n.name;
                                    if (n.type === "folder") {
                                        const r = findName(n.children || [], id);
                                        if (r) return r;
                                    }
                                }
                                return "";
                            };
                            const newName = window.prompt("Rename:", findName(fileTree, selectedNodeId));
                            if (newName?.trim()) handleRename(selectedNodeId, newName.trim());
                        }}
                        onDelete={() => { setMenuOpen(false); handleDelete(selectedNodeId); }}
                    />
                </div>

                {/* Search */}
                <SearchBox value={searchTerm} onChange={setSearchTerm} />

                {/* Root-level create input (no folder targeted) */}
                {activeCreateType && createTargetFolderId === null && (
                    <div className="px-3 pb-2">
                        <div className="mb-1 text-xs text-slate-400 px-0.5">
                            {activeCreateType === "folder" ? "📁 New folder name" : "📄 New file name"}
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                autoFocus
                                type="text"
                                value={pendingName}
                                onChange={(e) => setPendingName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") { e.preventDefault(); handleSubmitCreate(); }
                                    if (e.key === "Escape") { e.preventDefault(); handleCancelCreate(); }
                                }}
                                placeholder={activeCreateType === "folder" ? "folder-name" : "file-name.js"}
                                className="flex-1 rounded bg-slate-700 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-indigo-400 placeholder:text-slate-500"
                            />
                            <button
                                type="button"
                                onClick={handleSubmitCreate}
                                className="rounded bg-indigo-600 px-2.5 py-1.5 text-sm text-white hover:bg-indigo-500 active:bg-indigo-700"
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelCreate}
                                className="rounded bg-slate-700 px-2.5 py-1.5 text-sm text-slate-300 hover:bg-slate-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* File tree */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <TreeView
                        nodes={filteredTree}
                        searchTerm={searchTerm}
                        selectedFileId={activeFileId}
                        selectedFolderId={selectedFolderId}
                        selectedNodeId={selectedNodeId}
                        activeCreateType={activeCreateType}
                        pendingName={pendingName}
                        onOpenFile={(nodeId) => {
                            setSelectedNodeId(nodeId);
                            setSelectedNodeType("file");
                            openFile(nodeId);
                        }}
                        onSelectFolder={(nodeId) => {
                            setSelectedFolderId(nodeId);
                            setSelectedNodeId(nodeId);
                            setSelectedNodeType("folder");
                        }}
                        onSelectNode={(nodeId, nodeType) => {
                            setSelectedNodeId(nodeId);
                            setSelectedNodeType(nodeType);
                            if (nodeType === "folder") setSelectedFolderId(nodeId);
                        }}
                        onRename={handleRename}
                        onDelete={handleDelete}
                        onCreateFile={handleCreateFileInFolder}
                        onCreateFolder={handleCreateFolderInFolder}
                        onCreateInputChange={setPendingName}
                        onCreateSubmit={handleSubmitCreate}
                        onCreateCancel={handleCancelCreate}
                    />
                </div>
            </aside>
        </>
    );
}

export default ExplorerDrawer;
