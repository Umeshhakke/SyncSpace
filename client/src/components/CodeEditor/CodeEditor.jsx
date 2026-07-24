import React, { useState, useRef } from "react";
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
 * Wraps Monaco Editor with language selection capabilities.
 */
const CodeEditor = ({
  defaultValue = "// Type your code here...",
  theme = "vs-dark",
  height = "500px",
  width = "100%",
  onMount,
  onChange,
  options = {},
}) => {
  // Store selected language in React state (default: javascript)
  const [language, setLanguage] = useState("javascript");

  // References to store Monaco editor and monaco library instances
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

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
   * Handler for language dropdown changes
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);

    if (editorRef.current && monacoRef.current) {
      // 1. Obtain current Monaco model
      const model = editorRef.current.getModel();
      if (model) {
        // 2. Dynamically switch language model while preserving editor text content
        monacoRef.current.editor.setModelLanguage(model, newLanguage);
      }
    }
  };

  return (
    <div className="code-editor-container" style={styles.container}>
      <div className="code-editor-toolbar" style={styles.toolbar}>
        <label htmlFor="language-select" style={styles.label}>
          Language:
        </label>
        <select
          id="language-select"
          value={language}
          onChange={handleLanguageChange}
          style={styles.select}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <div className="monaco-editor-wrapper" style={styles.editorWrapper}>
        <Editor
          height={height}
          width={width}
          language={language}
          defaultValue={defaultValue}
          theme={theme}
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

// Styling for clean, dark-themed responsive toolbar and editor container
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    backgroundColor: "#1e1e1e",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "8px 16px",
    backgroundColor: "#252526",
    borderBottom: "1px solid #3c3c3c",
    gap: "10px",
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
  editorWrapper: {
    flex: 1,
    width: "100%",
  },
};

export default CodeEditor;
