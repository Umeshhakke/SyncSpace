import TreeNode from "./TreeNode";

function TreeView({
    nodes,
    searchTerm,
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
    if (!nodes || nodes.length === 0) {
        return (
            <div className="space-y-4 overflow-y-auto p-3 text-sm text-slate-500">
                {activeCreateType ? (
                    <div className="px-1">
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
                                onBlur={onCreateCancel}
                                placeholder={activeCreateType === "folder" ? "folder-name" : "file-name.js"}
                                className="flex-1 rounded bg-slate-700 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-indigo-400 placeholder:text-slate-500"
                            />
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); onCreateSubmit(); }} className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs text-white hover:bg-indigo-500">✓</button>
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); onCreateCancel(); }} className="rounded bg-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-600">✕</button>
                        </div>
                    </div>
                ) : searchTerm?.trim() ? (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-4 text-slate-400 text-center text-xs">
                        No files matched your search.
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-4 text-slate-400 text-center text-xs">
                        No files yet.<br />Click + to create a file.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="overflow-y-auto px-2 py-1">
            {/* Root-level inline create input (when no folder is selected) */}
            {activeCreateType && !selectedFolderId && (
                <div className="mb-1 px-1">
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
                            onBlur={onCreateCancel}
                            placeholder={activeCreateType === "folder" ? "folder-name" : "file-name.js"}
                            className="flex-1 rounded bg-slate-700 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-indigo-400 placeholder:text-slate-500"
                        />
                        <button type="button" onMouseDown={(e) => { e.preventDefault(); onCreateSubmit(); }} className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs text-white hover:bg-indigo-500">✓</button>
                        <button type="button" onMouseDown={(e) => { e.preventDefault(); onCreateCancel(); }} className="rounded bg-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-600">✕</button>
                    </div>
                </div>
            )}

            {nodes.map((node) => (
                <TreeNode
                    key={node.id}
                    node={node}
                    depth={0}
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
    );
}

export default TreeView;
