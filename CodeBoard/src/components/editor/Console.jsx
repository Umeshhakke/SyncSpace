import { X, Trash2, Terminal, Square, Copy, Download } from "lucide-react";
import { useEffect, useRef } from "react";
import InputPanel from "./InputPanel";
import { LANGUAGE_META } from "./runtime/executeCode";

function Console({
    outputLines = [],
    onClear,
    onClose,
    onStop,
    onCopy,
    onDownload,
    stdin,
    onStdinChange,
    runStatus,
    executionTime,
    showInput = false,
    language = "javascript",
}) {
    const bottomRef = useRef(null);
    const meta = LANGUAGE_META[language] ?? LANGUAGE_META.plaintext;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [outputLines]);

    const statusConfig = {
        running:  { label: "Running…",  cls: "text-sky-400 border-sky-800 bg-sky-950/50"    },
        success:  { label: executionTime ? `✔ ${executionTime} ms` : "Success", cls: "text-green-400 border-green-800 bg-green-950/50" },
        failed:   { label: "✖ Failed",  cls: "text-red-400 border-red-800 bg-red-950/50"    },
        stopped:  { label: "Stopped",   cls: "text-slate-400 border-slate-700 bg-slate-900"  },
        idle:     { label: "Idle",      cls: "text-slate-500 border-slate-700 bg-slate-900"  },
    };
    const status = statusConfig[runStatus] ?? statusConfig.idle;

    return (
        <div className="min-h-[180px] max-h-80 resize-y overflow-hidden border-t border-slate-200 bg-slate-950 flex flex-col">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-800 px-4 py-2.5">

                <Terminal size={16} className="text-green-400 flex-shrink-0" />

                {/* Language badge */}
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.bg} ${meta.text}`}
                    style={{ borderColor: `${meta.color}30` }}
                >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                </span>

                <span className="text-sm font-semibold text-white">Output</span>

                {/* Run status pill */}
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>
                    {status.label}
                </span>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <IconBtn onClick={onStop}     disabled={runStatus !== "running"} title="Stop"     icon={<Square size={13} />} />
                    <IconBtn onClick={onCopy}     title="Copy output"  icon={<Copy size={13} />} />
                    <IconBtn onClick={onDownload} title="Download"     icon={<Download size={13} />} />
                    <IconBtn onClick={onClear}    title="Clear"        icon={<Trash2 size={13} />} />
                    <IconBtn onClick={onClose}    title="Close"        icon={<X size={13} />} />
                </div>
            </div>

            {/* ── Stdin ───────────────────────────────────────────────────── */}
            {showInput && <InputPanel value={stdin} onChange={onStdinChange} />}

            {/* ── Output lines ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto px-4 py-3 font-mono text-sm space-y-0.5">
                {outputLines.length === 0 ? (
                    <p className="text-slate-500">
                        Press{" "}
                        <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">Ctrl</kbd>
                        {" + "}
                        <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">Enter</kbd>
                        {" or click "}
                        <span className="text-green-400 font-medium">Run {meta.label}</span>
                        {" to execute…"}
                    </p>
                ) : (
                    <>
                        {outputLines.map((line, i) => (
                            <div
                                key={i}
                                className={`whitespace-pre-wrap break-words leading-relaxed ${
                                    line.type === "error"   ? "text-red-400"   :
                                    line.type === "warn"    ? "text-yellow-400" :
                                    line.type === "info"    ? "text-sky-400"    :
                                    line.type === "success" ? "text-green-400 font-semibold" :
                                    "text-slate-200"
                                }`}
                            >
                                <span className="mr-2 text-[10px] text-slate-600">
                                    {line.timestamp?.toLocaleTimeString()}
                                </span>
                                {line.text}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>
        </div>
    );
}

/** Small icon button used in the console toolbar */
function IconBtn({ onClick, disabled, title, icon }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
            {icon}
        </button>
    );
}

export default Console;