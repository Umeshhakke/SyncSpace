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
 * language selection, and real-time Yjs collaborative language synchronization.
 */
const CodeEditor = ({
  defaultValue = "// Type your code here...",
  isDarkMode = true,
  theme,
  height = "100%",
  width = "100%",
  doc,
  metaMap: metaMapProp,
  onMount,
  onChange,
  options = {},
}) => {
  // Derive Monaco theme dynamically based on isDarkMode prop
  const editorTheme = theme || (isDarkMode ? "vs-dark" : "vs");

  // Store selected language in React state (default: javascript)
  const [language, setLanguage] = useState("javascript");

  // References to store Monaco editor and monaco library instances
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // STEP 1: Obtain Yjs shared map for editor metadata ("meta")
  const metaMap = metaMapProp || (doc ? doc.getMap("meta") : null);

  /**
   * Callback fired when Monaco Editor finishes mounting
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (onMount) {
      onMount(editor, monaco);
    }
  };

  /**
   * Handler for local language dropdown changes
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;

    // STEP 4: Prevent unnecessary processing if language is unchanged
    if (newLanguage === language) return;

    setLanguage(newLanguage);

    // Update local Monaco editor model language
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, newLanguage);
      }
    }

    // STEP 2: Propagate selected language to shared Yjs metadata map
    if (metaMap) {
      metaMap.set("language", newLanguage);
    }
  };

  // STEP 3: Register Yjs observer for collaborative language changes
  useEffect(() => {
    if (!metaMap) return;

    const handleMetaChange = (event) => {
      const remoteLanguage = metaMap.get("language");
      if (!remoteLanguage) return;

      // STEP 4: Prevent synchronization loops if received language matches local state
      setLanguage((prevLanguage) => {
        if (prevLanguage === remoteLanguage) {
          return prevLanguage;
        }

        // STEP 5: Update Monaco model language without recreating editor/model/Y.Doc
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

    // STEP 6: Remove observer inside useEffect cleanup
    return () => {
      metaMap.unobserve(handleMetaChange);
    };
  }, [metaMap]);

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
