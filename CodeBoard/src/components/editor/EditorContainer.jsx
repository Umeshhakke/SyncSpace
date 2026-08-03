import { useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useProject } from "./context";
import { useWorkspace } from "../../context/WorkspaceContext";

function EditorContainer() {
    const { activeFile, activeFileText, updateFileContent } = useProject();
    const { doc, setAwarenessField, awarenessStates, codeText } = useWorkspace();

    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const decorationIdsRef = useRef([]);
    const lastCursorUpdateRef = useRef(0);

    // ── Refs keep the editor mount closure from going stale ──────────────────
    // These are updated on every render via the useEffects below.
    const activeFileTextRef = useRef(activeFileText);
    const docRef = useRef(doc);
    const codeTextRef = useRef(codeText);
    // When true, we are programmatically pushing remote content — suppress echo.
    const applyingRemoteRef = useRef(false);
    // Tracks whether the editor has been mounted at least once (for re-mount sync)
    const mountedRef = useRef(false);

    useEffect(() => { activeFileTextRef.current = activeFileText; }, [activeFileText]);
    useEffect(() => { docRef.current = doc; }, [doc]);
    useEffect(() => { codeTextRef.current = codeText; }, [codeText]);

    // ── Cursor / awareness ───────────────────────────────────────────────────
    const updateCursor = useCallback(() => {
        const editor = editorRef.current;
        if (!editor || !setAwarenessField) return;
        const now = Date.now();
        if (now - lastCursorUpdateRef.current < 50) return;
        lastCursorUpdateRef.current = now;
        const position = editor.getPosition();
        if (position) {
            setAwarenessField("editorCursor", {
                lineNumber: position.lineNumber,
                column: position.column,
            });
        }
    }, [setAwarenessField]);

    // ── Remote Yjs → Monaco sync ─────────────────────────────────────────────
    // Runs whenever activeFileText changes (i.e. a different file is opened).
    // Uses Y.Text observe to receive delta events from other users and applies
    // them as Monaco model edits so cursor / undo history is preserved.
    useEffect(() => {
        if (!activeFileText) return;

        const syncRemoteChanges = (event, transaction) => {
            // Ignore updates originated by this client
            if (transaction?.origin === "local") return;

            const editor = editorRef.current;
            const monaco = monacoRef.current;
            if (!editor || !monaco) return;

            const model = editor.getModel();
            if (!model) return;

            applyingRemoteRef.current = true;
            try {
                const ops = [];
                let index = 0;

                for (const delta of event.changes.delta) {
                    if (delta.retain !== undefined) {
                        index += delta.retain;
                    } else if (delta.delete !== undefined) {
                        const startPos = model.getPositionAt(index);
                        const endPos = model.getPositionAt(index + delta.delete);
                        ops.push({
                            range: new monaco.Range(
                                startPos.lineNumber,
                                startPos.column,
                                endPos.lineNumber,
                                endPos.column
                            ),
                            text: "",
                        });
                        // Do NOT advance index — positions are pre-deletion offsets
                    } else if (delta.insert !== undefined) {
                        const pos = model.getPositionAt(index);
                        ops.push({
                            range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                            text: delta.insert,
                        });
                        index += delta.insert.length;
                    }
                }

                if (ops.length > 0) {
                    model.applyEdits(ops);
                }
            } finally {
                applyingRemoteRef.current = false;
            }
        };

        // When switching to a new file (editor remounts because key changes),
        // the editor may not exist yet — the initial load is handled inside
        // handleEditorMount. But if we are re-observing after a Yjs doc reconnect
        // without a remount, sync now.
        const editor = editorRef.current;
        if (editor && mountedRef.current) {
            const sharedValue = activeFileText.toString();
            const currentValue = editor.getValue();
            if (currentValue !== sharedValue) {
                applyingRemoteRef.current = true;
                editor.setValue(sharedValue);
                applyingRemoteRef.current = false;
            }
        }

        activeFileText.observe(syncRemoteChanges);
        return () => {
            activeFileText.unobserve(syncRemoteChanges);
        };
    }, [activeFileText]);

    // ── Cursor event listeners (re-attached after remount) ───────────────────
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const disposables = [
            editor.onDidChangeCursorSelection(updateCursor),
            editor.onDidChangeCursorPosition(updateCursor),
            editor.onDidFocusEditorWidget(() => {
                setAwarenessField?.("editing", true);
                updateCursor();
            }),
            editor.onDidBlurEditorWidget(() => {
                setAwarenessField?.("editing", false);
            }),
        ];

        return () => disposables.forEach((d) => d.dispose());
    }, [setAwarenessField, updateCursor]);

    // ── Remote cursor decorations ────────────────────────────────────────────
    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;

        const decorations = (awarenessStates || [])
            .filter((state) => state.clientId !== doc?.clientID && state.user && state.editorCursor)
            .map((state) => ({
                range: new monaco.Range(
                    state.editorCursor.lineNumber,
                    state.editorCursor.column,
                    state.editorCursor.lineNumber,
                    state.editorCursor.column
                ),
                options: {
                    className: "remoteCursorDecoration",
                    after: {
                        contentText: state.user.name,
                        inlineClassName: "remoteCursorLabel",
                    },
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                },
            }));

        decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
        return () => {
            if (editorRef.current) {
                decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
            }
        };
    }, [awarenessStates, doc]);

    // ── Editor mount handler ─────────────────────────────────────────────────
    const handleEditorMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        mountedRef.current = true;

        // Load the current shared text — read from ref so we always get the latest
        // value even if the React state hasn't propagated to this callback yet.
        const sharedText = activeFileTextRef.current;
        if (sharedText) {
            applyingRemoteRef.current = true;
            editor.setValue(sharedText.toString());
            applyingRemoteRef.current = false;
        }

        updateCursor();

        // Register the model-content-change listener ONCE per mount.
        // All mutable values are read from refs so no stale closures.
        editor.onDidChangeModelContent((event) => {
            if (applyingRemoteRef.current) return;

            const currentFileText = activeFileTextRef.current;
            const currentDoc = docRef.current;
            const currentCodeText = codeTextRef.current;

            if (!currentFileText || !currentDoc) return;

            currentDoc.transact(() => {
                // Apply changes in reverse order to keep offsets valid
                for (let i = event.changes.length - 1; i >= 0; i--) {
                    const change = event.changes[i];
                    if (change.rangeLength > 0) {
                        currentFileText.delete(change.rangeOffset, change.rangeLength);
                    }
                    if (change.text.length > 0) {
                        currentFileText.insert(change.rangeOffset, change.text);
                    }
                }

                // Mirror to shared `code` Y.Text so Run always has the latest
                try {
                    if (currentCodeText) {
                        const current = editor.getValue();
                        currentCodeText.delete(0, currentCodeText.length);
                        currentCodeText.insert(0, current);
                    }
                } catch {
                    // ignore
                }
            }, "local"); // tag origin as "local" so the remote observer ignores it
        });
    }, [updateCursor]); // stable — only updateCursor is a dep, which is also stable

    // ── Render ───────────────────────────────────────────────────────────────

    if (!activeFile) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-950 text-slate-400">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold">No File Open</h2>
                    <p className="mt-2">Select a file from the explorer to start editing.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden">
            {/*
              key={activeFile.id} forces Monaco to fully remount when the active
              file changes, ensuring correct language mode and a fresh content load.
              The handleEditorMount callback reads activeFileTextRef.current so it
              always gets the correct Y.Text even immediately after a state update.
            */}
            <Editor
                key={activeFile.id}
                height="100%"
                theme="vs-dark"
                language={activeFile.language}
                defaultValue=""
                onMount={handleEditorMount}
                options={{
                    fontSize: 14,
                    fontLigatures: true,
                    minimap: { enabled: true },
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    renderWhitespace: "selection",
                    tabSize: 4,
                    padding: { top: 16 },
                }}
            />
        </div>
    );
}

export default EditorContainer;
