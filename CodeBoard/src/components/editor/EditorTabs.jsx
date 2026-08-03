import { X } from "lucide-react";
import { useProject } from "./context";

function EditorTabs() {
    const { openFiles, activeFileId, setActiveFileId, closeFile } = useProject();

    return (
        <div className="min-h-[42px] border-b border-slate-200 bg-slate-50 px-3">
            <div className="flex h-10 items-center gap-2 overflow-x-auto py-2">
                {openFiles.length === 0 ? (
                    <div className="text-sm text-slate-500">No file open</div>
                ) : (
                    openFiles.map((file) => {
                        const isActive = file.id === activeFileId;

                        return (
                            <div
                                key={file.id}
                                className={`inline-flex items-center gap-2 rounded-t-md border border-slate-200 border-b-0 bg-white transition ${
                                    isActive
                                        ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                                        : "border-slate-200 bg-slate-100 text-slate-600"
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setActiveFileId(file.id)}
                                    className="inline-flex items-center gap-2 rounded-t-md bg-transparent px-3 py-2 text-sm font-medium transition hover:bg-slate-200"
                                >
                                    <span>{file.name}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        closeFile(file.id);
                                    }}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-tr-md rounded-br-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                    aria-label={`Close ${file.name}`}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default EditorTabs;
