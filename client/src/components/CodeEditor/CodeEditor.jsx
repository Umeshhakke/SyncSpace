import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

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
 * Responsive Monaco Editor component with full panel layout, dynamic theme,
 * language selection, metadata sync, Yjs collaborative editing (Y.Text),
 * and real-time remote cursor & selection synchronization via Yjs Awareness API.
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
  username = "Anonymous",
  onMount,
  onChange,
  options = {},
}) => {
  // Derive Monaco theme dynamically based on isDarkMode prop
  const editorTheme = theme || (isDarkMode ? "vs-dark" : "vs");

  // Store selected language in React state (default: javascript)
  const [language, setLanguage] = useState("javascript");

  // State to track when Monaco editor has finished mounting
  const [isEditorReady, setIsEditorReady] = useState(false);

  // References to store Monaco editor and monaco library instances
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Ref to track active Monaco decoration IDs for remote cursors & selections
  const decorationIdsRef = useRef([]);

  // Synchronization flag ref to prevent infinite echo loops between local & remote text changes
  const isUpdatingRef = useRef(false);

  // Obtain Yjs shared objects
  const metaMap = metaMapProp || (doc ? doc.getMap("meta") : null);
  const awareness = awarenessProp || provider?.awareness || (doc ? provider?.awareness : null);

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

  /**
   * Handler for local language dropdown changes
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;

    // Prevent unnecessary processing if language is unchanged
    if (newLanguage === language) return;

    setLanguage(newLanguage);

    // Update local Monaco editor model language
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, newLanguage);
      }
    }

    // Propagate selected language to shared Yjs metadata map
    if (metaMap) {
      metaMap.set("language", newLanguage);
    }
  };

  // Register Yjs observer for collaborative language metadata changes
  useEffect(() => {
    if (!metaMap) return;

    const handleMetaChange = (event) => {
      const remoteLanguage = metaMap.get("language");
      if (!remoteLanguage) return;

      // Prevent synchronization loops if received language matches local state
      setLanguage((prevLanguage) => {
        if (prevLanguage === remoteLanguage) {
          return prevLanguage;
        }

        // Update Monaco model language without recreating editor/model/Y.Doc
        if (editorRef.current && monacoRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            monacoRef.current.editor.setModelLanguage(model, remoteLanguage);
          }
        }

        return remoteLanguage;
      });
    };

    // Observe changes on Yjs meta map
    metaMap.observe(handleMetaChange);

    // Initial sync check for existing language in shared Yjs metaMap on mount
    const currentMetaLanguage = metaMap.get("language");
    if (currentMetaLanguage && currentMetaLanguage !== language) {
      setLanguage(currentMetaLanguage);
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelLanguage(model, currentMetaLanguage);
        }
      }
    }

    // Cleanup observer on unmount
    return () => {
      metaMap.unobserve(handleMetaChange);
    };
  }, [metaMap]);

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

    // Local Typing Synchronization (Monaco Editor content change -> Y.Text)
    const contentChangeListener = editor.onDidChangeModelContent(() => {
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
    };
  }, [doc, codeTextProp, isEditorReady]);

  // PHASE 6: Real-time Remote Cursor & Selection Synchronization using Yjs Awareness API
  useEffect(() => {
    if (!awareness || !editorRef.current || !monacoRef.current || !isEditorReady) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const localClientId = doc?.clientID || awareness.clientID;

    // 1. Broadcast local cursor movement and text selection to Yjs Awareness
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

    // 2. Render remote cursors and text selection highlights in Monaco
    const updateRemoteCursors = () => {
      const states = awareness.getStates();
      const newDecorations = [];
      let dynamicCSS = "";

      states.forEach((state, clientId) => {
        // Ignore local client
        if (clientId === localClientId) return;

        const cursorState = state.cursor;
        if (!cursorState) return;

        const userColor = getClientColor(clientId);
        const remoteName = cursorState.username || `User ${clientId}`;

        // Dynamic CSS classes for remote cursor caret and selection background
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

        // Render Selection Range Highlight if text selection exists
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

        // Render Remote Cursor Caret Indicator
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

      // Update dynamic style sheet rules
      styleElement.textContent = dynamicCSS;

      // Update Monaco decorations atomically replacing old decorations
      decorationIdsRef.current = editor.deltaDecorations(
        decorationIdsRef.current,
        newDecorations
      );
    };

    // Observe changes on Yjs awareness instance
    awareness.on("change", updateRemoteCursors);
    updateRemoteCursors();

    // 3. Cleanup listeners and decorations on unmount or room leave
    return () => {
      cursorSelectionListener.dispose();
      awareness.off("change", updateRemoteCursors);

      // Remove local awareness state
      awareness.setLocalStateField("cursor", null);

      // Remove all Monaco remote cursor decorations
      if (editorRef.current) {
        decorationIdsRef.current = editorRef.current.deltaDecorations(
          decorationIdsRef.current,
          []
        );
      }
    };
  }, [awareness, doc, username, isEditorReady]);

  // Dynamic styles for dark vs light mode container and toolbar
  const activeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <div className="code-editor-container" style={activeStyles.container}>
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
  );
};

// Base layout styles shared across dark/light modes
const baseContainerStyle = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  borderRadius: "8px",
  overflow: "hidden",
  boxSizing: "border-box",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
  container: {
    ...baseContainerStyle,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    backgroundColor: "#1e1e1e",
  },
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
  container: {
    ...baseContainerStyle,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    backgroundColor: "#ffffff",
  },
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
