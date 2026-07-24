import React, { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "./codeEditor.css";

/**
 * ============================================
 * CodeEditor Component
 * ============================================
 * A wrapper around Monaco Editor with:
 * - Syntax highlighting
 * - Line numbers
 * - Theme support
 * - Language selection
 * - Editor instance reference for Yjs integration
 *
 * @component
 */
const CodeEditor = () => {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(`function hello() {
  console.log("Welcome to SyncSpace!");
}

// Start coding here...
`);

  /**
   * Called when the editor is mounted
   * Stores the editor instance for future use (Yjs integration)
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    console.log("✅ Monaco Editor Ready");
    console.log("📝 Editor instance stored in ref");

    // Optional: Configure editor settings
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });

    // Add custom theme (optional)
    monaco.editor.defineTheme("syncspace-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1e1e2e",
        "editor.foreground": "#cdd6f4",
        "editor.lineHighlightBackground": "#313244",
        "editor.selectionBackground": "#45475a",
      },
    });

    // Apply the theme
    monaco.editor.setTheme("syncspace-dark");
  };

  /**
   * Handle language change
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    console.log("📝 Language changed to:", newLanguage);
  };

  /**
   * Handle code change
   */
  const handleCodeChange = (value) => {
    setCode(value || "");
    console.log("✏️ Code updated, length:", (value || "").length);
  };

  /**
   * Get the editor instance for external use
   */
  const getEditor = () => {
    return editorRef.current;
  };

  // Log when editor ref changes
  useEffect(() => {
    console.log(
      "🔄 Editor ref updated:",
      editorRef.current ? "Available" : "Not yet",
    );
  }, [editorRef.current]);

  // Languages supported by Monaco
  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "ruby", label: "Ruby" },
    { value: "php", label: "PHP" },
  ];

  return (
    <div className="code-editor-wrapper">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <span className="editor-icon">📝</span>
          <span className="editor-title">Code Editor</span>
        </div>
        <div className="editor-toolbar-right">
          <select
            className="language-selector"
            value={language}
            onChange={handleLanguageChange}
            title="Select Language"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <span className="editor-status">
            {editorRef.current ? "🟢 Connected" : "🟡 Loading..."}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="code-editor-container">
        <Editor
          height="100%"
          width="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: "on",
            renderWhitespace: "selection",
            tabSize: 2,
            insertSpaces: true,
            bracketPairColorization: {
              enabled: true,
            },
            matchBrackets: "always",
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            folding: true,
            foldingStrategy: "indentation",
            formatOnPaste: true,
            formatOnType: true,
            wordWrap: "on",
          }}
          theme="syncspace-dark"
        />
      </div>
    </div>
  );
};

export default CodeEditor;
