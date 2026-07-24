import React, { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "./codeEditor.css";

/**
 * ============================================
 * CodeEditor Component - Professional Setup
 * ============================================
 * Fully configured Monaco Editor with:
 * - Dark theme (vs-dark)
 * - Professional settings
 * - Language support
 * - Editor ref for Yjs integration
 */
const CodeEditor = () => {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [code, setCode] = useState(`function hello() {
  console.log("Welcome to SyncSpace!");
}

// Start coding here...
// Try typing: const sum = (a, b) => a + b;
`);

  /**
   * Called when the editor is mounted
   * Stores editor instance and applies settings
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);
    console.log("✅ Monaco Editor mounted");

    // Apply professional settings
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
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
      matchBrackets: "always",
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
      folding: true,
      foldingStrategy: "indentation",
      smoothScrolling: true,
      cursorSmoothCaretAnimation: true,
    });

    // Define custom theme
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
        { token: "operator", foreground: "ff79c6" },
      ],
      colors: {
        "editor.background": "#1e1e2e",
        "editor.foreground": "#cdd6f4",
        "editor.lineHighlightBackground": "#313244",
        "editor.selectionBackground": "#45475a",
        "editor.inactiveSelectionBackground": "#313244",
        "editorIndentGuide.background": "#313244",
        "editorIndentGuide.activeBackground": "#45475a",
        "editor.lineNumber.foreground": "#6c7086",
        "editor.lineNumber.activeForeground": "#cdd6f4",
      },
    });

    // Apply theme
    monaco.editor.setTheme("syncspace-dark");

    // Focus the editor
    editor.focus();
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
   * Get editor instance for external use
   */
  const getEditor = () => editorRef.current;

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
          <span className="editor-status">{isEditorReady ? "🟢" : "🟡"}</span>
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
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            matchBrackets: "always",
            folding: true,
            foldingStrategy: "indentation",
            smoothScrolling: true,
            cursorSmoothCaretAnimation: true,
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
