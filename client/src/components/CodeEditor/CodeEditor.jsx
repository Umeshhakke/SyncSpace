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
 * CodeEditor Component
 * Responsive Monaco Editor component with full panel layout, dynamic theme,
 * language selection, metadata sync, and Yjs real-time collaborative text editing (Y.Text).
 */
const CodeEditor = ({
  defaultValue = "// Type your code here...",
  isDarkMode = true,
  theme,
  height = "100%",
  width = "100%",
  doc,
  metaMap: metaMapProp,
  codeText: codeTextProp,
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

  // PART 6: Synchronization flag ref to prevent infinite echo loops between local & remote changes
  const isUpdatingRef = useRef(false);

  // Obtain Yjs shared map for editor metadata ("meta")
  const metaMap = metaMapProp || (doc ? doc.getMap("meta") : null);

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

  // PARTS 3, 4, 5, 6, 7: Real-time collaborative code text editing via Y.Text ("code")
  useEffect(() => {
    // PART 2: Obtain Y.Text instance from props or doc
    const activeCodeText = codeTextProp || (doc ? doc.getText("code") : null);
    if (!activeCodeText || !editorRef.current || !isEditorReady) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // PART 3: Initialize Monaco from Y.Text if codeText already contains content
    const initialText = activeCodeText.toString();
    if (initialText.length > 0 && model.getValue() !== initialText) {
      isUpdatingRef.current = true;
      model.setValue(initialText);
      isUpdatingRef.current = false;
    }

    // PART 5: Remote Synchronization (Y.Text observer -> Monaco Editor)
    const handleCodeTextChange = (event) => {
      // PART 6: Skip update if change originated locally
      if (isUpdatingRef.current) return;

      const remoteText = activeCodeText.toString();
      const currentLocalText = model.getValue();

      // PART 6: If Monaco already contains identical content, skip update
      if (currentLocalText === remoteText) return;

      isUpdatingRef.current = true;

      // Execute edits in Monaco to preserve undo stack and cursor position where possible
      editor.executeEdits("yjs-sync", [
        {
          range: model.getFullModelRange(),
          text: remoteText,
          forceMoveMarkers: true,
        },
      ]);

      isUpdatingRef.current = false;
    };

    // Observe changes on Y.Text instance
    activeCodeText.observe(handleCodeTextChange);

    // PART 4: Local Typing Synchronization (Monaco Editor content change -> Y.Text)
    const contentChangeListener = editor.onDidChangeModelContent(() => {
      // PART 6: Skip writing back if update originated from Y.Text observer
      if (isUpdatingRef.current) return;

      const localText = model.getValue();
      const currentYText = activeCodeText.toString();

      // PART 6: Before updating, compare editor value with Y.Text content
      if (localText === currentYText) return;

      isUpdatingRef.current = true;

      // Synchronize entire editor value into Y.Text using Y.Doc transaction
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
    };

    // PART 7: Cleanup Monaco listeners and Yjs observers on component unmount
    return () => {
      activeCodeText.unobserve(handleCodeTextChange);
      contentChangeListener.dispose();
    };
  }, [doc, codeTextProp, isEditorReady]);

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
