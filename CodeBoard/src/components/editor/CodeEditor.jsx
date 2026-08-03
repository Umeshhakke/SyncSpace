import { useEffect, useState, useCallback } from "react";
import Panel from "../layout/Panel";

import EditorHeader from "./EditorHeader";
import EditorTabs from "./EditorTabs";
import EditorContainer from "./EditorContainer";
import Console from "./Console";
import CommandPalette from "./CommandPalette";

import { ExplorerDrawer } from "./explorer";
import { ProjectProvider, useProject } from "./context";
import { useWorkspace } from "../../context/WorkspaceContext";
import useEditorUI from "./hooks/useEditorUI";

/** Returns true when the code likely reads from stdin — shows the input panel. */
function fileRequiresStdin(content = "", language = "") {
    if (language === "javascript" || language === "typescript") {
        return /\b(prompt|readline\.createInterface|process\.stdin|fs\.readFileSync\s*\(\s*0|window\.prompt)\b/i.test(content);
    }
    if (language === "python") {
        return /\b(input|raw_input|sys\.stdin|sys\.argv)\b/i.test(content);
    }
    if (language === "java") {
        return /\bnew\s+Scanner\s*\(|new\s+BufferedReader\s*\(\s*new\s+InputStreamReader\s*\(\s*System\.in\)/i.test(content);
    }
    if (language === "cpp") {
        return /\b(cin\s*>>|scanf\s*\(|gets\s*\(|fgets\s*\(|std::cin\s*>>)/i.test(content);
    }
    return false;
}

function CodeEditorContent() {
    const {
        isExplorerOpen,
        isConsoleVisible,
        outputLines,
        stdin,
        runStatus,
        executionTime,
        toggleExplorer,
        closeExplorer,
        runEditor,
        stopExecution,
        clearConsole,
        closeConsole,
        setStdin,
    } = useEditorUI();

    const { activeFile, activeFileText, closeFile, activeFileId } = useProject();
    const { codeText } = useWorkspace();

    const [isPaletteOpen, setPaletteOpen] = useState(false);
    const [paletteQuery, setPaletteQuery] = useState("");

    // ── Run handler ───────────────────────────────────────────────────────────
    const handleRun = useCallback(() => {
        // Source priority: per-file Y.Text → shared codeText → file.content
        const code = activeFileText?.toString?.() ?? codeText?.toString?.() ?? activeFile?.content ?? "";
        const language = activeFile?.language ?? "javascript";
        runEditor(code, language);
    }, [activeFile, activeFileText, codeText, runEditor]);

    // ── Ctrl+Enter shortcut ───────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            // Ctrl+Enter or Cmd+Enter → run
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (runStatus !== "running") handleRun();
            }
            // Ctrl+Shift+P → command palette
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
                e.preventDefault();
                setPaletteQuery("");
                setPaletteOpen(true);
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleRun, runStatus]);

    // ── Output helpers ────────────────────────────────────────────────────────
    function handleCopyOutput() {
        navigator.clipboard
            .writeText(outputLines.map((l) => l.text).join("\n"))
            .catch(() => {});
    }

    function handleDownloadOutput() {
        const blob = new Blob([outputLines.map((l) => l.text).join("\n")], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `output-${activeFile?.name ?? "code"}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ── Command palette commands ───────────────────────────────────────────────
    const commandList = [
        { label: "Run Code",          description: `Run active file (Ctrl+Enter)`,   onSelect: handleRun      },
        { label: "Stop Execution",    description: "Stop the current run",            onSelect: stopExecution  },
        { label: "Toggle Explorer",   description: "Show or hide the file explorer",  onSelect: toggleExplorer },
        { label: "Clear Console",     description: "Clear the output",                onSelect: clearConsole   },
        { label: "Close Console",     description: "Hide the output panel",           onSelect: closeConsole   },
        { label: "Close Active Tab",  description: "Close the current editor tab",    onSelect: () => activeFileId && closeFile(activeFileId) },
    ];

    return (
        <Panel className="relative flex h-full flex-col min-h-0 overflow-hidden">

            <ExplorerDrawer isOpen={isExplorerOpen} onClose={closeExplorer} />

            <CommandPalette
                isOpen={isPaletteOpen}
                query={paletteQuery}
                onQueryChange={setPaletteQuery}
                onClose={() => setPaletteOpen(false)}
                commands={commandList}
            />

            <div className="flex h-full flex-col min-h-0">

                <EditorHeader
                    onToggleExplorer={toggleExplorer}
                    onRun={handleRun}
                    onStop={stopExecution}
                    isRunning={runStatus === "running"}
                />

                <EditorTabs />

                <div className="flex-1 min-h-0 overflow-hidden">
                    <EditorContainer />
                </div>

                {isConsoleVisible && (
                    <Console
                        outputLines={outputLines}
                        onClear={clearConsole}
                        onClose={closeConsole}
                        onStop={stopExecution}
                        onCopy={handleCopyOutput}
                        onDownload={handleDownloadOutput}
                        stdin={stdin}
                        onStdinChange={setStdin}
                        runStatus={runStatus}
                        executionTime={executionTime}
                        language={activeFile?.language ?? "javascript"}
                        showInput={fileRequiresStdin(activeFile?.content, activeFile?.language)}
                    />
                )}

            </div>
        </Panel>
    );
}

function CodeEditor() {
    return (
        <ProjectProvider>
            <CodeEditorContent />
        </ProjectProvider>
    );
}

export default CodeEditor;