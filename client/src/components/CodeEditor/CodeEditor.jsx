import React, { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import useYjsEditor from "../../hooks/useYjsEditor";
import "./codeEditor.css";

/**
 * ============================================
 * CodeEditor Component with Yjs Integration
 * ============================================
 * Monaco Editor with Yjs shared document.
 * Currently independent - binding will be added Day 4.
 */
const CodeEditor = () => {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  // Initialize Yjs document and shared text
  const { ydoc, yText, isInitialized, version, getContent } = useYjsEditor();

  /**
   * Called when the editor is mounted
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);
    console.log("✅ Monaco Editor mounted");
    console.log("📝 Editor stored in ref");

    // Apply editor settings
    editor.updateOptions({
      fontSize: 15,
      fontFamily: 'Consolas, "Courier New", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      roundedSelection: true,
      cursorBlinking: "smooth",
      formatOnPaste: true,
      formatOnType: true,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      lineNumbers: "on",
      bracketPairColorization: { enabled: true },
      matchBrackets: "always",
      folding: true,
      smoothScrolling: true,
    });

    // Define theme
    monaco.editor.defineTheme("syncspace-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6272a4" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "string", foreground: "f1fa8c" },
        { token: "number", foreground: "bd93f9" },
        { token: "function", foreground: "50fa7b" },
        { token: "variable", foreground: "f8f8f2" },
      ],
      colors: {
        "editor.background": "#1e1e2e",
        "editor.foreground": "#cdd6f4",
        "editor.lineHighlightBackground": "#313244",
        "editor.selectionBackground": "#45475a",
      },
    });

    monaco.editor.setTheme("syncspace-dark");
    editor.focus();

    // Log Yjs state
    console.log("📊 Yjs State in Editor:");
    console.log("  - Y.Doc ready:", !!ydoc);
    console.log("  - Y.Text ready:", !!yText);
    console.log("  - Y.Text content length:", yText.length);
    console.log(
      "  - Y.Text content preview:",
      yText.toString().substring(0, 50) + "...",
    );
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
   * Handle code change - currently local only
   * Will be replaced with Yjs binding in Day 4
   */
  const handleCodeChange = (value) => {
    setEditorContent(value || "");
    // Note: In Day 4, this will be handled by Yjs
  };

  /**
   * Format code
   */
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
      console.log("📝 Code formatted");
    }
  };

  /**
   * Log Yjs state on demand
   */
  const logYjsState = () => {
    console.log("📊 Yjs Document State:");
    console.log("  - Initialized:", isInitialized);
    console.log("  - Version:", version);
    console.log("  - Content Length:", yText.length);
    console.log("  - Full Content:", yText.toString());
  };

  // Log when Yjs state changes
  useEffect(() => {
    if (isInitialized) {
      console.log("🔄 Yjs document updated, version:", version);
    }
  }, [isInitialized, version]);

  // Languages supported
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
          {isEditorReady && <span className="editor-ready-badge">● Ready</span>}
          {isInitialized && <span className="editor-yjs-badge">🔄 Synced</span>}
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
          <button
            className="format-btn"
            onClick={handleFormatCode}
            title="Format Code (Shift+Alt+F)"
          >
            ✨ Format
          </button>
          <button
            className="format-btn"
            onClick={logYjsState}
            title="Log Yjs State"
          >
            📊 Debug
          </button>
          <span className="editor-status">{isEditorReady ? "🟢" : "🟡"}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="code-editor-container">
        <Editor
          height="100%"
          width="100%"
          language={language}
          value={editorContent}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="syncspace-dark"
          options={{
            automaticLayout: true,
            fontSize: 15,
            fontFamily: 'Consolas, "Courier New", monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            roundedSelection: true,
            cursorBlinking: "smooth",
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 4,
            insertSpaces: true,
            lineNumbers: "on",
            bracketPairColorization: { enabled: true },
            matchBrackets: "always",
            folding: true,
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
