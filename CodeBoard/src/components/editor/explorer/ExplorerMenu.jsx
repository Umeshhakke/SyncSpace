function ExplorerMenu({ open, onNewFile, onNewFolder, onRename, onDelete }) {
    if (!open) {
        return null;
    }

    return (
        <div className="absolute left-3 top-full z-30 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
            <button
                type="button"
                onClick={onNewFile}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
            >
                New File
            </button>
            <button
                type="button"
                onClick={onNewFolder}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
            >
                New Folder
            </button>
            <div className="my-1 h-px bg-slate-800" />
            <button
                type="button"
                onClick={onRename}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
            >
                Rename
            </button>
            <button
                type="button"
                onClick={onDelete}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
            >
                Delete
            </button>
        </div>
    );
}

export default ExplorerMenu;
