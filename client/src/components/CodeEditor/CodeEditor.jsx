import React, { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import useYjsEditor from "../../hooks/useYjsEditor";
import "./codeEditor.css";

/**
 * ============================================
 * CodeEditor Component with Yjs Binding
 * ============================================
 * Monaco Editor connected to Yjs shared text via MonacoBinding.
 * All changes are synchronized both ways.
 */
const CodeEditor = () => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isBindingReady, setIsBindingReady] = useState(false);

  // Initialize Yjs document and shared text
  const { ydoc, yText, isInitialized, version, getContent } = useYjsEditor();

  /**
   * Called when the editor is mounted
   * Creates the MonacoBinding between editor and Y.Text
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
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

    monaco.editor.setTheme("syncspace-dark");
    editor.focus();

    // Create the MonacoBinding after editor is ready
    createBinding(editor);
  };

  /**
   * Create MonacoBinding between editor and Y.Text
   */
  const createBinding = (editor) => {
    try {
      // Get the editor model
      const model = editor.getModel();
      if (!model) {
        console.warn("⚠️ Editor model not available");
        return;
      }

      console.log("📝 Creating MonacoBinding...");
      console.log("  - Y.Text length:", yText.length);
      console.log("  - Model value length:", model.getValue().length);

      // Create the binding
      const binding = new MonacoBinding(
        yText, // Y.Text shared document
        model, // Monaco editor model
        new Set([editor]), // Set of editors sharing this model
        null, // Awareness (cursor presence) - coming later
      );

      bindingRef.current = binding;
      setIsBindingReady(true);
      console.log("✅ MonacoBinding created successfully!");
      console.log("🔄 Editor ↔ Y.Text synchronized");

      // Log initial state
      console.log("📊 Initial binding state:");
      console.log("  - Y.Text content length:", yText.length);
      console.log("  - Model value length:", model.getValue().length);
      console.log(
        "  - Content matches:",
        yText.toString() === model.getValue(),
      );
    } catch (error) {
      console.error("❌ Failed to create MonacoBinding:", error);
    }
  };

  /**
   * Cleanup binding on unmount or when dependencies change
   */
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        console.log("🗑️ Destroying MonacoBinding...");
        bindingRef.current.destroy();
        bindingRef.current = null;
        setIsBindingReady(false);
        console.log("✅ MonacoBinding destroyed");
      }
    };
  }, []);

  /**
   * Handle language change
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    console.log("📝 Language changed to:", newLanguage);

    // Update editor language
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, newLanguage);
      }
    }
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
   * Log Yjs state for debugging
   */
  const logYjsState = () => {
    console.log("📊 Yjs Document State:");
    console.log("  - Initialized:", isInitialized);
    console.log("  - Version:", version);
    console.log("  - Y.Text length:", yText.length);
    console.log("  - Y.Text content:", yText.toString());
    console.log("  - Binding active:", !!bindingRef.current);

    if (editorRef.current) {
      const model = editorRef.current.getModel();
      console.log("  - Editor model length:", model?.getValue().length || 0);
      console.log(
        "  - Sync status:",
        yText.toString() === model?.getValue() ? "✅ Synced" : "❌ Out of sync",
      );
    }
  };

  /**
   * Test Yjs programmatic update
   */
  const testYjsUpdate = () => {
    const testText = `\n// Programmatic update from Yjs at ${new Date().toLocaleTimeString()}\n`;
    yText.insert(yText.length, testText);
    console.log("📝 Programmatic Yjs update inserted");
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
          {isBindingReady && (
            <span className="editor-binding-badge">🔗 Bound</span>
          )}
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
            onClick={testYjsUpdate}
            title="Test Yjs Programmatic Update"
          >
            📝 Test Yjs
          </button>
          <button
            className="format-btn debug-btn"
            onClick={logYjsState}
            title="Log Yjs State"
          >
            📊 Debug
          </button>
          <span className="editor-status">
            {isBindingReady ? "🟢" : isEditorReady ? "🟡" : "🔴"}
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
