import React, { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import useYjsEditor from "../../hooks/useYjsEditor";
import "./codeEditor.css";

/**
 * ============================================
 * CodeEditor Component - Clean UI Only
 * ============================================
 * This component only handles rendering Monaco Editor.
 * All Yjs/Monaco synchronization logic is in useYjsEditor hook.
 */
const CodeEditor = () => {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Initialize Yjs hook - all sync logic is here
  const {
    ydoc,
    yText,
    isBound,
    isInitialized,
    version,
    getBindingStatus,
    forceSync,
    insertText,
  } = useYjsEditor(editorRef, {
    roomId: "default-room",
    enableAwareness: false,
  });

  /**
   * Called when editor is mounted
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);
    console.log("✅ Monaco Editor mounted");

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
  };

  /**
   * Handle language change
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    console.log("📝 Language changed to:", newLanguage);

    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        // Update language - this doesn't affect Yjs content
        const monaco = window.monaco;
        if (monaco) {
          monaco.editor.setModelLanguage(model, newLanguage);
        }
      }
    }
  };

  /**
   * Handle format code
   */
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
      console.log("📝 Code formatted");
    }
  };

  /**
   * Test Yjs programmatic update
   */
  const handleTestYjs = () => {
    const testText = `\n// Programmatic update from Yjs at ${new Date().toLocaleTimeString()}\n`;
    insertText(yText.length, testText);
    console.log("📝 [UI] Programmatic Yjs update triggered");
  };

  /**
   * Debug Yjs state
   */
  const handleDebug = () => {
    console.log("📊 [UI] Yjs State:");
    console.log(`  - Initialized: ${isInitialized}`);
    console.log(`  - Bound: ${isBound}`);
    console.log(`  - Version: ${version}`);
    console.log(`  - Content Length: ${yText.length}`);

    const status = getBindingStatus();
    console.log("📊 [UI] Binding Status:", status);
  };

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
          {isInitialized && <span className="editor-yjs-badge">🔄 Yjs</span>}
          {isBound && <span className="editor-binding-badge">🔗 Bound</span>}
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
            className="format-btn test-btn"
            onClick={handleTestYjs}
            title="Test Yjs Programmatic Update"
          >
            📝 Test Yjs
          </button>
          <button
            className="format-btn debug-btn"
            onClick={handleDebug}
            title="Debug Yjs State"
          >
            📊 Debug
          </button>
          <span className="editor-status">
            {isBound ? "🟢" : isEditorReady ? "🟡" : "🔴"}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="code-editor-container">
        <Editor
          height="100%"
          width="100%"
          language={language}
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
