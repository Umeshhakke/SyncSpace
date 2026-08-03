import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useWorkspace } from "../../../context/WorkspaceContext";

const ProjectContext = createContext();

const INITIAL_FILE_ID = "main-default-file";

function createInitialFile() {
    return {
        id: INITIAL_FILE_ID,
        name: "main.js",
        type: "file",
        language: "javascript",
        content: "",
    };
}

// ── Pure helpers (outside component — stable references) ─────────────────────

export function getLanguage(fileName) {
    const ext = (fileName || "").split(".").pop().toLowerCase();
    const map = {
        js: "javascript", jsx: "javascript",
        ts: "typescript", tsx: "typescript",
        json: "json", html: "html", css: "css",
        md: "markdown", py: "python",
        java: "java", cpp: "cpp", cc: "cpp", cxx: "cpp",
    };
    return map[ext] || "plaintext";
}

export function findNodeById(nodes, id) {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.type === "folder") {
            const found = findNodeById(node.children || [], id);
            if (found) return found;
        }
    }
    return null;
}

function updateTree(nodes, folderId, callback) {
    return nodes.map((node) => {
        if (node.id === folderId && node.type === "folder")
            return { ...node, children: callback(node.children || []) };
        if (node.type === "folder")
            return { ...node, children: updateTree(node.children || [], folderId, callback) };
        return node;
    });
}

function updateNode(nodes, nodeId, callback) {
    return nodes.map((node) => {
        if (node.id === nodeId) return callback(node);
        if (node.type === "folder")
            return { ...node, children: updateNode(node.children || [], nodeId, callback) };
        return node;
    });
}

function deleteNode(nodes, nodeId) {
    return nodes
        .map((node) => {
            if (node.type === "folder")
                return { ...node, children: deleteNode(node.children || [], nodeId) };
            return node;
        })
        .filter((n) => n.id !== nodeId);
}

function collectFileIds(node) {
    if (!node) return [];
    if (node.type === "file") return [node.id];
    return (node.children || []).flatMap(collectFileIds);
}

// ── Provider ──────────────────────────────────────────────────────────────────

function ProjectProvider({ children }) {
    const workspace = useWorkspace();
    const roomId = workspace?.roomId;

    const initialFile = useMemo(() => createInitialFile(), []);

    // Start with the initial file locally — Yjs will overwrite once synced
    const [fileTree, setFileTree] = useState([initialFile]);
    const [openFiles, setOpenFiles] = useState([initialFile]);
    const [activeFileId, setActiveFileId] = useState(initialFile.id);
    const [activeFileText, setActiveFileText] = useState(null);

    // True once we have seeded the Yjs tree (first user in room)
    const seededRef = useRef(false);
    // True once Yjs has sent us at least one sync (even empty)
    const yjsSyncedRef = useRef(false);

    const sharedDoc = workspace.doc;
    const sharedFileTree = useMemo(() => sharedDoc?.getArray("fileTree"), [sharedDoc]);

    const getSharedFileText = useCallback(
        (fileId) => {
            if (!sharedDoc || !fileId) return null;
            return sharedDoc.getText(`file-${fileId}`);
        },
        [sharedDoc]
    );

    // ── Write the entire tree to Yjs ─────────────────────────────────────────
    const writeSharedTree = useCallback((nodes) => {
        if (!sharedFileTree || !sharedDoc) return;
        sharedDoc.transact(() => {
            sharedFileTree.delete(0, sharedFileTree.length);
            sharedFileTree.insert(0, nodes);
        });
    }, [sharedFileTree, sharedDoc]);

    // ── CRUD ──────────────────────────────────────────────────────────────────

    function createFile(folderId, fileName) {
        if (!fileName?.trim()) return;

        const newFile = {
            id: crypto.randomUUID(),
            name: fileName.trim(),
            type: "file",
            language: getLanguage(fileName.trim()),
            content: "",
        };

        // Resolve folder: if folderId points to a file node, create at root
        const targetNode = folderId ? findNodeById(fileTree, folderId) : null;
        const resolvedId = targetNode?.type === "folder" ? folderId : null;

        // Compute new tree using current fileTree directly (event handler context — no stale state risk)
        const nextTree = resolvedId
            ? updateTree(fileTree, resolvedId, (ch) => [...ch, newFile])
            : [...fileTree, newFile];

        // Update local state and Yjs separately — NEVER call writeSharedTree inside setFileTree updater
        // because React Strict Mode double-invokes updaters, which would double-write to Yjs.
        setFileTree(nextTree);
        writeSharedTree(nextTree);

        setOpenFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
    }

    function createFolder(folderId, folderName) {
        if (!folderName?.trim()) return;

        const newFolder = {
            id: crypto.randomUUID(),
            name: folderName.trim(),
            type: "folder",
            children: [],
        };

        const targetNode = folderId ? findNodeById(fileTree, folderId) : null;
        const resolvedId = targetNode?.type === "folder" ? folderId : null;

        const nextTree = resolvedId
            ? updateTree(fileTree, resolvedId, (ch) => [...ch, newFolder])
            : [...fileTree, newFolder];

        setFileTree(nextTree);
        writeSharedTree(nextTree);
    }

    function renameNode(nodeId, newName) {
        if (!newName?.trim() || !nodeId) return;
        const nextTree = updateNode(fileTree, nodeId, (node) => ({
            ...node,
            name: newName.trim(),
            ...(node.type === "file" ? { language: getLanguage(newName.trim()) } : {}),
        }));
        setFileTree(nextTree);
        writeSharedTree(nextTree);
        setOpenFiles((prev) =>
            prev.map((f) =>
                f.id === nodeId
                    ? { ...f, name: newName.trim(), language: getLanguage(newName.trim()) }
                    : f
            )
        );
    }

    function deleteNodeById(nodeId) {
        if (!nodeId) return;
        const target = findNodeById(fileTree, nodeId);
        if (!target) return;

        const filesToRemove = collectFileIds(target);
        const nextTree = deleteNode(fileTree, nodeId);

        setFileTree(nextTree);
        writeSharedTree(nextTree);

        setOpenFiles((prev) => {
            const remaining = prev.filter((f) => !filesToRemove.includes(f.id));
            setActiveFileId((cur) =>
                filesToRemove.includes(cur)
                    ? remaining.length ? remaining[remaining.length - 1].id : null
                    : cur
            );
            return remaining;
        });
    }

    function openFile(fileId) {
        const file = findNodeById(fileTree, fileId);
        if (!file || file.type !== "file") return;
        setOpenFiles((prev) => (prev.some((f) => f.id === fileId) ? prev : [...prev, file]));
        setActiveFileId(fileId);
    }

    function closeFile(fileId) {
        setOpenFiles((prev) => {
            const remaining = prev.filter((f) => f.id !== fileId);
            if (activeFileId === fileId) {
                setActiveFileId(remaining.length ? remaining[remaining.length - 1].id : null);
            }
            return remaining;
        });
    }

    function updateFileContent(fileId, content) {
        const fileText = getSharedFileText(fileId);
        if (fileText && sharedDoc) {
            const current = fileText.toString();
            if (current !== content) {
                sharedDoc.transact(() => {
                    let s = 0;
                    while (s < current.length && s < content.length && current[s] === content[s]) s++;
                    let eO = current.length, eN = content.length;
                    while (eO > s && eN > s && current[eO - 1] === content[eN - 1]) { eO--; eN--; }
                    if (eO > s) fileText.delete(s, eO - s);
                    if (eN > s) fileText.insert(s, content.slice(s, eN));
                });
            }
        }
        const upd = (nodes) =>
            nodes.map((n) => {
                if (n.id === fileId) return { ...n, content };
                if (n.type === "folder") return { ...n, children: upd(n.children || []) };
                return n;
            });
        setFileTree((p) => upd(p));
        setOpenFiles((p) => p.map((f) => (f.id === fileId ? { ...f, content } : f)));
    }

    function updateFileLanguage(fileId, language) {
        const upd = (nodes) =>
            nodes.map((n) => {
                if (n.id === fileId && n.type === "file") return { ...n, language };
                if (n.type === "folder") return { ...n, children: upd(n.children || []) };
                return n;
            });
        setFileTree((p) => { const next = upd(p); writeSharedTree(next); return next; });
        setOpenFiles((p) => p.map((f) => (f.id === fileId ? { ...f, language } : f)));
    }

    // ── Yjs → Local: sync file tree ───────────────────────────────────────────
    // This is the SINGLE source of truth for fileTree after connection.
    // When another user changes the tree, this fires immediately.
    useEffect(() => {
        if (!sharedFileTree) return;

        const syncTree = () => {
            const nodes = sharedFileTree.toArray();
            yjsSyncedRef.current = true;
            if (nodes.length > 0) {
                setFileTree(nodes);
            }
        };

        syncTree();
        sharedFileTree.observe(syncTree);
        return () => sharedFileTree.unobserve(syncTree);
    }, [sharedFileTree]);

    // ── Seed: first user inserts the initial file tree into Yjs ──────────────
    // Fires exactly once when Yjs is synced AND the shared tree is empty.
    // Uses a ref guard so it never runs twice even if deps re-fire.
    useEffect(() => {
        if (!sharedFileTree || !sharedDoc || !workspace.synced) return;
        if (sharedFileTree.length > 0) return;   // tree already has data — don't seed
        if (seededRef.current) return;             // already seeded this session

        seededRef.current = true;

        // Seed only the bare initial file — no localStorage bleed-in
        const seedTree = [createInitialFile()];
        sharedDoc.transact(() => {
            sharedFileTree.insert(0, seedTree);
        });
        // The syncTree observer will immediately update local fileTree from Yjs
    }, [sharedFileTree, sharedDoc, workspace.synced]);

    // ── Keep openFiles names/language in sync with fileTree (from peers) ──────
    useEffect(() => {
        setOpenFiles((prev) => {
            const updated = prev
                .map((f) => {
                    const node = findNodeById(fileTree, f.id);
                    if (!node || node.type !== "file") return null;
                    return { ...f, name: node.name, language: node.language };
                })
                .filter(Boolean);

            if (activeFileId && !updated.some((f) => f.id === activeFileId)) {
                setActiveFileId(updated.length ? updated[updated.length - 1].id : null);
            }

            return updated;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileTree]);

    // ── Active file Y.Text ────────────────────────────────────────────────────
    useEffect(() => {
        if (!activeFileId) { setActiveFileText(null); return; }
        setActiveFileText(getSharedFileText(activeFileId));
    }, [activeFileId, getSharedFileText]);

    // ── Sync active file content from peers ───────────────────────────────────
    useEffect(() => {
        if (!activeFileText || !activeFileId) return;

        const syncContent = () => {
            const text = activeFileText.toString();
            setOpenFiles((prev) =>
                prev.map((f) => (f.id === activeFileId ? { ...f, content: text } : f))
            );
        };

        syncContent();
        activeFileText.observe(syncContent);
        return () => activeFileText.unobserve(syncContent);
    }, [activeFileText, activeFileId]);

    // ── Persist per-room to localStorage ─────────────────────────────────────
    useEffect(() => {
        if (typeof window === "undefined" || !roomId) return;
        window.localStorage.setItem(
            `codeboard-project-${roomId}`,
            JSON.stringify({ fileTree, openFiles, activeFileId })
        );
    }, [fileTree, openFiles, activeFileId, roomId]);

    // ─────────────────────────────────────────────────────────────────────────

    const activeFile = openFiles.find((f) => f.id === activeFileId) || null;

    const value = {
        fileTree,
        openFiles,
        activeFileId,
        activeFile,
        activeFileText,
        createFile,
        createFolder,
        openFile,
        closeFile,
        updateFileContent,
        updateFileLanguage,
        renameNode,
        deleteNodeById,
        setActiveFileId,
    };

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

function useProject() {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error("useProject must be used inside ProjectProvider.");
    return ctx;
}

export { ProjectProvider, useProject };
