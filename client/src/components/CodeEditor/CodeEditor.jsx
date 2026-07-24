import React, { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import EditorToolbar from "./EditorToolbar";
import useYjsEditor from "../../hooks/useYjsEditor";
import "./codeEditor.css";

/**
 * ============================================
 * CodeEditor Component with Professional Toolbar
 * ============================================
 * Full-featured Monaco Editor with:
 * - Language selection
 * - Theme switching
 * - Font size control
 * - Tab size control
 * - Minimap toggle
 * - Formatting
 * - Yjs collaboration
 */
const CodeEditor = () => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Editor settings state
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(15);
  const [tabSize, setTabSize] = useState(4);
  const [showMinimap, setShowMinimap] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Initialize Yjs hook
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
    monacoRef.current = monaco;
    setIsEditorReady(true);
    console.log("✅ Monaco Editor mounted");

    // Apply editor settings
    editor.updateOptions({
      fontSize: fontSize,
      tabSize: tabSize,
      fontFamily: 'Consolas, "Courier New", monospace',
      minimap: { enabled: showMinimap },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      roundedSelection: true,
      cursorBlinking: "smooth",
      formatOnPaste: true,
      formatOnType: true,
      automaticLayout: true,
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
    });

    // Define custom themes
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

    monaco.editor.defineTheme("syncspace-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6a737d" },
        { token: "keyword", foreground: "d73a49" },
        { token: "string", foreground: "032f62" },
        { token: "number", foreground: "005cc5" },
        { token: "function", foreground: "6f42c1" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#24292e",
        "editor.lineHighlightBackground": "#f6f8fa",
        "editor.selectionBackground": "#c8e1ff",
        "editor.inactiveSelectionBackground": "#e8f0fe",
        "editorIndentGuide.background": "#e1e4e8",
        "editorIndentGuide.activeBackground": "#d0d7de",
        "editor.lineNumber.foreground": "#6a737d",
        "editor.lineNumber.activeForeground": "#24292e",
      },
    });

    // Apply initial theme
    monaco.editor.setTheme(theme);
    editor.focus();
  };

  /**
   * Update editor settings when they change
   */
  React.useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: fontSize,
        tabSize: tabSize,
        minimap: { enabled: showMinimap },
      });
    }
  }, [fontSize, tabSize, showMinimap]);

  /**
   * Update theme when it changes
   */
  React.useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(theme);
      console.log("🎨 Theme applied:", theme);
    }
  }, [theme]);

  /**
   * Update language when it changes
   */
  React.useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, language);
        console.log("📝 Language applied:", language);
      }
    }
  }, [language]);

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

  return (
    <div className="code-editor-wrapper">
      {/* Professional Toolbar */}
      <EditorToolbar
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        tabSize={tabSize}
        setTabSize={setTabSize}
        showMinimap={showMinimap}
        setShowMinimap={setShowMinimap}
        editorRef={editorRef}
        isBound={isBound}
        isInitialized={isInitialized}
      />

      {/* Editor */}
      <div className="code-editor-container">
        <Editor
          height="100%"
          width="100%"
          language={language}
          theme={theme}
          onMount={handleEditorDidMount}
          options={{
            fontSize: fontSize,
            tabSize: tabSize,
            fontFamily: 'Consolas, "Courier New", monospace',
            minimap: { enabled: showMinimap },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            roundedSelection: true,
            cursorBlinking: "smooth",
            formatOnPaste: true,
            formatOnType: true,
            automaticLayout: true,
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
