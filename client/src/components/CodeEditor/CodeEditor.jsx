import React, { useState, useRef, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import ParticipantsPanel from "./ParticipantsPanel";
import FileExplorer from "../FileExplorer/FileExplorer";

// List of supported languages for the Monaco editor selector
const SUPPORTED_LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
];

/**
 * Generate a deterministic hex color based on Yjs clientID
 */
const getClientColor = (clientId) => {
  const colors = [
    "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
    "#2196f3", "#00bcd4", "#009688", "#4caf50",
    "#ff9800", "#ff5722", "#795548", "#607d8b"
  ];
  return colors[Math.abs(Number(clientId)) % colors.length];
};

/**
 * CodeEditor Component
 * Multi-file collaborative workspace with Shared File Explorer, Yjs Text sync,
 * remote cursor & selection sync, User Presence panel, dynamic theme, and responsive panel layout.
 */
const CodeEditor = ({
  defaultValue = "// Type your code here...",
  isDarkMode = true,
  theme,
  height = "100%",
  width = "100%",
  doc,
  provider,
  awareness: awarenessProp,
  metaMap: metaMapProp,
  codeText: codeTextProp,
  filesArray: filesArrayProp,
  username = "Anonymous",
  onMount,
  onChange,
  options = {},
}) => {
  // Derive Monaco theme dynamically based on isDarkMode prop
  const editorTheme = theme || (isDarkMode ? "vs-dark" : "vs");

  // Store selected language in React state (default: javascript)
  const [language, setLanguage] = useState("javascript");

  // Store multi-file workspace list and active file state
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  // State to track local user typing status
  const [isTyping, setIsTyping] = useState(false);

  // State to track connected participants for the presence panel
  const [participants, setParticipants] = useState([]);

  // State to track when Monaco editor has finished mounting
  const [isEditorReady, setIsEditorReady] = useState(false);

  // References to store Monaco editor and monaco library instances
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Ref for typing timeout (1000ms debounce)
  const typingTimeoutRef = useRef(null);

  // Ref to store timestamp when local user joined session
  const joinedAtRef = useRef(Date.now());

  // Ref to track active Monaco decoration IDs for remote cursors & selections
  const decorationIdsRef = useRef([]);

  // Synchronization flag ref to prevent infinite echo loops between local & remote text changes
  const isUpdatingRef = useRef(false);

  // Obtain Yjs shared objects
  const metaMap = metaMapProp || (doc ? doc.getMap("meta") : null);
  const filesArray = filesArrayProp || (doc ? doc.getArray("files") : null);
  const awareness = awarenessProp || provider?.awareness || (doc ? provider?.awareness : null);
  const localClientId = doc?.clientID || awareness?.clientID;

  // Memoize deterministic local user color
  const localUserColor = useMemo(
    () => getClientColor(localClientId || 1),
    [localClientId]
  );

  /**
   * Callback fired when Monaco Editor finishes mounting
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    if (onMount) {
      onMount(editor, monaco);
    }
  };

  // PHASE 8: Initialize & Observe Yjs Shared Files Array ("files") and Active File ("activeFileId")
  useEffect(() => {
    if (!filesArray) return;

    // 1. Initial workspace setup if empty: populate default file
    if (filesArray.length === 0) {
      const defaultFile = {
        id: "file-main",
        name: "main.js",
        language: "javascript",
        createdAt: Date.now(),
      };

      const targetDoc = doc || filesArray.doc;
      if (targetDoc) {
        targetDoc.transact(() => {
          filesArray.push([defaultFile]);
        });
      } else {
        filesArray.push([defaultFile]);
      }
    }

    // Update local files state
    const currentFiles = filesArray.toArray();
    setFiles(currentFiles);

    // Initial active file check
    if (metaMap) {
      const currentActiveId = metaMap.get("activeFileId");
      if (currentActiveId) {
        setActiveFileId(currentActiveId);
      } else if (currentFiles.length > 0) {
        setActiveFileId(currentFiles[0].id);
        metaMap.set("activeFileId", currentFiles[0].id);
      }
    } else if (currentFiles.length > 0 && !activeFileId) {
      setActiveFileId(currentFiles[0].id);
    }

    // 2. Observe changes on Y.Array ("files")
    const handleFilesChange = (event) => {
      const updatedFiles = filesArray.toArray();
      setFiles(updatedFiles);

      // If active file was deleted, switch to first available file
      if (
        activeFileId &&
        !updatedFiles.some((f) => f.id === activeFileId) &&
        updatedFiles.length > 0
      ) {
        const fallbackId = updatedFiles[0].id;
        setActiveFileId(fallbackId);
        if (metaMap) {
          metaMap.set("activeFileId", fallbackId);
          metaMap.set("language", updatedFiles[0].language);
        }
      }
    };

    filesArray.observe(handleFilesChange);

    return () => {
      filesArray.unobserve(handleFilesChange);
    };
  }, [filesArray, metaMap, doc]);

  // PHASE 8: Observe Active File changes on metaMap ("activeFileId")
  useEffect(() => {
    if (!metaMap) return;

    const handleMetaChange = (event) => {
      const newActiveId = metaMap.get("activeFileId");
      if (newActiveId && newActiveId !== activeFileId) {
        setActiveFileId(newActiveId);

        // Find file object to sync model language
        const targetFile = files.find((f) => f.id === newActiveId);
        if (targetFile) {
          setLanguage(targetFile.language);
          if (editorRef.current && monacoRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
              monacoRef.current.editor.setModelLanguage(model, targetFile.language);
            }
          }
        }
      }

      // Metadata language sync
      const remoteLanguage = metaMap.get("language");
      if (remoteLanguage && remoteLanguage !== language) {
        setLanguage(remoteLanguage);
        if (editorRef.current && monacoRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            monacoRef.current.editor.setModelLanguage(model, remoteLanguage);
          }
        }
      }
    };

    metaMap.observe(handleMetaChange);

    return () => {
      metaMap.unobserve(handleMetaChange);
    };
  }, [metaMap, activeFileId, files, language]);

  /**
   * File Explorer Handlers
   */
  const handleSelectFile = (fileId) => {
    if (fileId === activeFileId) return;

    setActiveFileId(fileId);
    if (metaMap) {
      metaMap.set("activeFileId", fileId);
    }

    const selectedFile = files.find((f) => f.id === fileId);
    if (selectedFile) {
      setLanguage(selectedFile.language);
      if (metaMap) {
        metaMap.set("language", selectedFile.language);
      }
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelLanguage(model, selectedFile.language);
        }
      }
    }
  };

  const handleCreateFile = (filename, derivedLang) => {
    if (!filesArray) return;

    const newFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: filename,
      language: derivedLang,
      createdAt: Date.now(),
    };

    const targetDoc = doc || filesArray.doc;
    if (targetDoc) {
      targetDoc.transact(() => {
        filesArray.push([newFile]);
      });
    } else {
      filesArray.push([newFile]);
    }

    handleSelectFile(newFile.id);
  };

  const handleRenameFile = (fileId, newName, derivedLang) => {
    if (!filesArray) return;

    const allFiles = filesArray.toArray();
    const index = allFiles.findIndex((f) => f.id === fileId);
    if (index === -1) return;

    const updatedFile = {
      ...allFiles[index],
      name: newName,
      language: derivedLang,
    };

    const targetDoc = doc || filesArray.doc;
    if (targetDoc) {
      targetDoc.transact(() => {
        filesArray.delete(index, 1);
        filesArray.insert(index, [updatedFile]);
      });
    } else {
      filesArray.delete(index, 1);
      filesArray.insert(index, [updatedFile]);
    }

    if (fileId === activeFileId) {
      setLanguage(derivedLang);
      if (metaMap) {
        metaMap.set("language", derivedLang);
      }
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelLanguage(model, derivedLang);
        }
      }
    }
  };

  const handleDeleteFile = (fileId) => {
    if (!filesArray || filesArray.length <= 1) return;

    const allFiles = filesArray.toArray();
    const index = allFiles.findIndex((f) => f.id === fileId);
    if (index === -1) return;

    const targetDoc = doc || filesArray.doc;
    if (targetDoc) {
      targetDoc.transact(() => {
        filesArray.delete(index, 1);
      });
    } else {
      filesArray.delete(index, 1);
    }
  };

  /**
   * Handler for local language dropdown changes
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;

    if (newLanguage === language) return;

    setLanguage(newLanguage);

    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, newLanguage);
      }
    }

    if (metaMap) {
      metaMap.set("language", newLanguage);
    }

    // Update active file language in filesArray
    if (filesArray && activeFileId) {
      const allFiles = filesArray.toArray();
      const index = allFiles.findIndex((f) => f.id === activeFileId);
      if (index !== -1) {
        const updatedFile = { ...allFiles[index], language: newLanguage };
        const targetDoc = doc || filesArray.doc;
        if (targetDoc) {
          targetDoc.transact(() => {
            filesArray.delete(index, 1);
            filesArray.insert(index, [updatedFile]);
          });
        }
      }
    }
  };

  // Publish local user presence state field "user" in Yjs Awareness
  useEffect(() => {
    if (!awareness) return;

    awareness.setLocalStateField("user", {
      id: localClientId,
      username: username || "Anonymous",
      color: localUserColor,
      language: language,
      typing: isTyping,
      joinedAt: joinedAtRef.current,
    });
  }, [awareness, localClientId, username, localUserColor, language, isTyping]);

  // Real-time collaborative code text editing via Y.Text ("code")
  useEffect(() => {
    const activeCodeText = codeTextProp || (doc ? doc.getText("code") : null);
    if (!activeCodeText || !editorRef.current || !isEditorReady) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Initialize Monaco from Y.Text if codeText already contains content
    const initialText = activeCodeText.toString();
    if (initialText.length > 0 && model.getValue() !== initialText) {
      isUpdatingRef.current = true;
      model.setValue(initialText);
      isUpdatingRef.current = false;
    }

    // Remote Synchronization (Y.Text observer -> Monaco Editor)
    const handleCodeTextChange = (event) => {
      if (isUpdatingRef.current) return;

      const remoteText = activeCodeText.toString();
      const currentLocalText = model.getValue();

      if (currentLocalText === remoteText) return;

      isUpdatingRef.current = true;

      editor.executeEdits("yjs-sync", [
        {
          range: model.getFullModelRange(),
          text: remoteText,
          forceMoveMarkers: true,
        },
      ]);

      isUpdatingRef.current = false;
    };

    activeCodeText.observe(handleCodeTextChange);

    // Local Typing Synchronization & Typing Indicator Detection (Monaco Editor -> Y.Text)
    const contentChangeListener = editor.onDidChangeModelContent(() => {
      if (!isUpdatingRef.current) {
        setIsTyping(true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 1000);
      }

      if (isUpdatingRef.current) return;

      const localText = model.getValue();
      const currentYText = activeCodeText.toString();

      if (localText === currentYText) return;

      isUpdatingRef.current = true;

      const targetDoc = doc || activeCodeText.doc;
      if (targetDoc) {
        targetDoc.transact(() => {
          activeCodeText.delete(0, activeCodeText.length);
          activeCodeText.insert(0, localText);
        });
      } else {
        activeCodeText.delete(0, activeCodeText.length);
        activeCodeText.insert(0, localText);
      }

      isUpdatingRef.current = false;
    });

    return () => {
      activeCodeText.unobserve(handleCodeTextChange);
      contentChangeListener.dispose();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [doc, codeTextProp, isEditorReady]);

  // Real-time Remote Cursor & Selection Synchronization using Yjs Awareness API
  useEffect(() => {
    if (!awareness || !editorRef.current || !monacoRef.current || !isEditorReady) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Broadcast local cursor movement and text selection to Yjs Awareness
    const cursorSelectionListener = editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      awareness.setLocalStateField("cursor", {
        lineNumber: selection.positionLineNumber,
        column: selection.positionColumn,
        selectionStart: {
          lineNumber: selection.startLineNumber,
          column: selection.startColumn,
        },
        selectionEnd: {
          lineNumber: selection.endLineNumber,
          column: selection.endColumn,
        },
        username: username || "Anonymous",
      });
    });

    // Dynamic style element tag to inject unique client cursor colors into document head
    let styleElement = document.getElementById("yjs-monaco-cursor-styles");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "yjs-monaco-cursor-styles";
      document.head.appendChild(styleElement);
    }

    // Render remote cursors and text selection highlights in Monaco
    const updateRemoteCursors = () => {
      const states = awareness.getStates();
      const newDecorations = [];
      let dynamicCSS = "";

      states.forEach((state, clientId) => {
        if (clientId === localClientId) return;

        const cursorState = state.cursor;
        if (!cursorState) return;

        const userColor = getClientColor(clientId);
        const remoteName = cursorState.username || `User ${clientId}`;

        const cursorClassName = `yjs-cursor-${clientId}`;
        const selectionClassName = `yjs-selection-${clientId}`;

        dynamicCSS += `
          .${cursorClassName} {
            position: absolute;
            border-left: 2px solid ${userColor};
            border-right: none;
            box-sizing: border-box;
            height: 100%;
          }
          .${cursorClassName}::after {
            content: "${remoteName}";
            position: absolute;
            top: -18px;
            left: -2px;
            background-color: ${userColor};
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 3px;
            white-space: nowrap;
            pointer-events: none;
            z-index: 10;
          }
          .${selectionClassName} {
            background-color: ${userColor}33;
          }
        `;

        const { lineNumber, column, selectionStart, selectionEnd } = cursorState;

        if (
          selectionStart &&
          selectionEnd &&
          (selectionStart.lineNumber !== selectionEnd.lineNumber ||
            selectionStart.column !== selectionEnd.column)
        ) {
          newDecorations.push({
            range: new monaco.Range(
              selectionStart.lineNumber,
              selectionStart.column,
              selectionEnd.lineNumber,
              selectionEnd.column
            ),
            options: {
              className: selectionClassName,
              isWholeLine: false,
            },
          });
        }

        if (lineNumber && column) {
          newDecorations.push({
            range: new monaco.Range(lineNumber, column, lineNumber, column),
            options: {
              className: cursorClassName,
              beforeContentClassName: undefined,
            },
          });
        }
      });

      styleElement.textContent = dynamicCSS;

      decorationIdsRef.current = editor.deltaDecorations(
        decorationIdsRef.current,
        newDecorations
      );
    };

    awareness.on("change", updateRemoteCursors);
    updateRemoteCursors();

    return () => {
      cursorSelectionListener.dispose();
      awareness.off("change", updateRemoteCursors);

      awareness.setLocalStateField("cursor", null);

      if (editorRef.current) {
        decorationIdsRef.current = editorRef.current.deltaDecorations(
          decorationIdsRef.current,
          []
        );
      }
    };
  }, [awareness, doc, localClientId, username, isEditorReady]);

  // Parse and sort active participants from Yjs Awareness states
  useEffect(() => {
    if (!awareness) {
      setParticipants([]);
      return;
    }

    const updateParticipantsList = () => {
      const states = awareness.getStates();
      const parsedList = [];

      states.forEach((state, clientId) => {
        const userState = state.user;
        if (userState) {
          parsedList.push({
            id: clientId,
            username: userState.username || `User ${clientId}`,
            color: userState.color || getClientColor(clientId),
            language: userState.language || language,
            typing: !!userState.typing,
            joinedAt: userState.joinedAt || 0,
            isLocal: clientId === localClientId,
          });
        } else if (state.cursor) {
          parsedList.push({
            id: clientId,
            username: state.cursor.username || `User ${clientId}`,
            color: getClientColor(clientId),
            language: language,
            typing: false,
            joinedAt: 0,
            isLocal: clientId === localClientId,
          });
        }
      });

      parsedList.sort((a, b) => {
        if (a.isLocal) return -1;
        if (b.isLocal) return 1;
        return a.username.localeCompare(b.username);
      });

      setParticipants(parsedList);
    };

    awareness.on("change", updateParticipantsList);
    updateParticipantsList();

    return () => {
      awareness.off("change", updateParticipantsList);
    };
  }, [awareness, doc, localClientId, language]);

  // Dynamic styles for dark vs light mode container and toolbar
  const activeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <div className="code-editor-workspace" style={activeStyles.workspaceLayout}>
      {/* PHASE 8: Shared File Explorer Sidebar */}
      <FileExplorer
        files={files}
        activeFileId={activeFileId}
        onSelectFile={handleSelectFile}
        onCreateFile={handleCreateFile}
        onRenameFile={handleRenameFile}
        onDeleteFile={handleDeleteFile}
        isDarkMode={isDarkMode}
      />

      {/* Main Editor Panel */}
      <div className="code-editor-main-panel" style={activeStyles.mainPanel}>
        {/* User Presence Panel */}
        <ParticipantsPanel
          participants={participants}
          isDarkMode={isDarkMode}
        />

        {/* Toolbar with Language Dropdown */}
        <div className="code-editor-toolbar" style={activeStyles.toolbar}>
          <label htmlFor="language-select" style={activeStyles.label}>
            Language:
          </label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            style={activeStyles.select}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Monaco Editor Wrapper */}
        <div className="monaco-editor-wrapper" style={activeStyles.editorWrapper}>
          <Editor
            height={height}
            width={width}
            language={language}
            defaultValue={defaultValue}
            theme={editorTheme}
            onMount={handleEditorDidMount}
            onChange={onChange}
            options={{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              ...options,
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Base layout styles shared across dark/light modes
const baseWorkspaceStyle = {
  display: "flex",
  flexDirection: "row",
  width: "100%",
  height: "100%",
  borderRadius: "8px",
  overflow: "hidden",
  boxSizing: "border-box",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const baseMainPanelStyle = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden",
};

const baseToolbarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "8px 16px",
  flexShrink: 0,
  gap: "10px",
  boxSizing: "border-box",
};

const baseEditorWrapperStyle = {
  flex: 1,
  width: "100%",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
};

// Dark Mode Styles
const darkStyles = {
  workspaceLayout: {
    ...baseWorkspaceStyle,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    backgroundColor: "#1e1e1e",
  },
  mainPanel: baseMainPanelStyle,
  toolbar: {
    ...baseToolbarStyle,
    backgroundColor: "#252526",
    borderBottom: "1px solid #3c3c3c",
  },
  label: {
    color: "#cccccc",
    fontSize: "13px",
    fontWeight: "500",
  },
  select: {
    backgroundColor: "#3c3c3c",
    color: "#ffffff",
    border: "1px solid #555555",
    borderRadius: "4px",
    padding: "4px 12px",
    fontSize: "13px",
    cursor: "pointer",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  },
  editorWrapper: baseEditorWrapperStyle,
};

// Light Mode Styles
const lightStyles = {
  workspaceLayout: {
    ...baseWorkspaceStyle,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    backgroundColor: "#ffffff",
  },
  mainPanel: baseMainPanelStyle,
  toolbar: {
    ...baseToolbarStyle,
    backgroundColor: "#f3f3f3",
    borderBottom: "1px solid #e0e0e0",
  },
  label: {
    color: "#333333",
    fontSize: "13px",
    fontWeight: "500",
  },
  select: {
    backgroundColor: "#ffffff",
    color: "#333333",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "4px 12px",
    fontSize: "13px",
    cursor: "pointer",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  },
  editorWrapper: baseEditorWrapperStyle,
};

export default CodeEditor;
