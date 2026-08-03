import { FilePlus, FolderPlus, MoreVertical } from "lucide-react";

function ExplorerHeader({ onMenuToggle, onNewFile, onNewFolder }) {
    return (
        <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-3">
            <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Explorer
                </p>
            </div>

            {/* Quick-access: New File */}
            <button
                type="button"
                id="btn-new-file"
                onClick={onNewFile}
                title="New File"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
                aria-label="New file"
            >
                <FilePlus size={16} />
            </button>

            {/* Quick-access: New Folder */}
            <button
                type="button"
                id="btn-new-folder"
                onClick={onNewFolder}
                title="New Folder"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
                aria-label="New folder"
            >
                <FolderPlus size={16} />
            </button>

            {/* More actions menu */}
            <button
                type="button"
                onClick={onMenuToggle}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
                aria-label="More explorer actions"
            >
                <MoreVertical size={16} />
            </button>
        </div>
    );
}

export default ExplorerHeader;
