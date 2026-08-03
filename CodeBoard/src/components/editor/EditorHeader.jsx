import { Menu, Play, Square, Settings2 } from "lucide-react";
import { useProject } from "./context";
import { useWorkspace } from "../../context/WorkspaceContext";
import { LANGUAGE_META } from "./runtime/executeCode";

const languageOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python",     label: "Python"     },
    { value: "java",       label: "Java"       },
    { value: "cpp",        label: "C++"        },
    { value: "html",       label: "HTML"       },
    { value: "css",        label: "CSS"        },
    { value: "json",       label: "JSON"       },
    { value: "markdown",   label: "Markdown"   },
    { value: "plaintext",  label: "Plain Text" },
];

function EditorHeader({ onToggleExplorer, onRun, onStop, isRunning }) {
    const { activeFile, updateFileLanguage } = useProject();
    const { connectionStatus } = useWorkspace();

    const activeLanguage = activeFile?.language ?? "javascript";
    const meta = LANGUAGE_META[activeLanguage] ?? LANGUAGE_META.plaintext;

    function handleLanguageChange(e) {
        if (!activeFile) return;
        updateFileLanguage(activeFile.id, e.target.value);
    }

    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">

            {/* Explorer toggle */}
            <button
                type="button"
                onClick={onToggleExplorer}
                title="Toggle Explorer"
                className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                aria-label="Toggle Explorer"
            >
                <Menu size={17} />
            </button>

            {/* Language selector */}
            <div className="flex flex-1 items-center gap-2">
                <label className="sr-only" htmlFor="language-selector">Select language</label>
                <select
                    id="language-selector"
                    value={activeLanguage}
                    onChange={handleLanguageChange}
                    disabled={!activeFile}
                    className="w-full max-w-[200px] rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {languageOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Language color dot */}
                {activeFile && (
                    <span
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                        <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: meta.color }}
                        />
                        {meta.label}
                    </span>
                )}
            </div>

            {/* Right side: status + run */}
            <div className="flex items-center gap-2">
                {/* Connection status */}
                <span
                    className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        connectionStatus === "Connected"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${connectionStatus === "Connected" ? "bg-green-500" : "bg-slate-400"}`} />
                    {connectionStatus || "Connecting"}
                </span>

                {/* Stop button — only visible while running */}
                {isRunning && (
                    <button
                        type="button"
                        onClick={onStop}
                        title="Stop execution"
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                    >
                        <Square size={14} />
                        Stop
                    </button>
                )}

                {/* Run button — shows language color when idle */}
                <button
                    type="button"
                    id="btn-run-code"
                    onClick={onRun}
                    disabled={isRunning || !activeFile}
                    title="Run code (Ctrl+Enter)"
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        isRunning
                            ? "bg-slate-700 hover:bg-slate-600"
                            : "bg-slate-900 hover:bg-slate-700"
                    }`}
                    style={!isRunning && activeFile ? { backgroundColor: meta.color === "#f7df1e" ? "#1a1a1a" : undefined } : undefined}
                >
                    {isRunning ? (
                        <>
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Running…
                        </>
                    ) : (
                        <>
                            <Play size={14} fill="currentColor" />
                            Run {meta.label}
                        </>
                    )}
                </button>

                {/* Settings */}
                <button
                    type="button"
                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                    aria-label="Settings"
                >
                    <Settings2 size={17} />
                </button>
            </div>
        </div>
    );
}

export default EditorHeader;
