import React, { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import EditorToolbar from "./EditorToolbar";
import EditorStatusBar from "./EditorStatusBar";
import useYjsEditor from "../../hooks/useYjsEditor";
import {
  editorOptions,
  themes,
  supportedLanguages,
  defaultSettings,
} from "../../utils/editorConfig";
import "./codeEditor.css";

/**
 * ============================================
 * CodeEditor - Main Component
 * ============================================
 * Full-featured Monaco Editor with:
 * - Professional toolbar
 * - Status bar
 * - Yjs collaboration
 * - Theme support
 * - Language selection
 *
 * Integration Points for Member 4:
 * 1. Pass provider to useYjsEditor
 * 2. Pass awareness to useYjsEditor
 * 3. Monitor connection status via hook
 */
const CodeEditor = () => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Editor settings state
  const [language, setLanguage] = useState(defaultSettings.language);
  const [theme, setTheme] = useState(defaultSettings.theme);
  const [fontSize, setFontSize] = useState(defaultSettings.fontSize);
  const [tabSize, setTabSize] = useState(defaultSettings.tabSize);
  const [showMinimap, setShowMinimap] = useState(defaultSettings.showMinimap);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Editor stats
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [lineCount, setLineCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

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
    roomId,
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
      minimap: { enabled: showMinimap },
      ...editorOptions,
    });

    // Register themes
    Object.values(themes).forEach((themeConfig) => {
      monaco.editor.defineTheme(themeConfig.id, themeConfig);
    });

    // Apply initial theme
    monaco.editor.setTheme(theme);
    editor.focus();

    // Set up cursor position listener
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Set up model content change listener
    const model = editor.getModel();
    if (model) {
      model.onDidChangeContent(() => {
        const value = model.getValue();
        setLineCount(value.split("\n").length);
        setCharacterCount(value.length);
      });
    }

    console.log("📊 Editor Stats initialized");
  };

  /**
   * Update editor settings when they change
   */
  useEffect(() => {
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
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(theme);
      console.log("🎨 Theme applied:", theme);
    }
  }, [theme]);

  /**
   * Update language when it changes
   */
  useEffect(() => {
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
    console.log(`  - Room ID: ${roomId}`);
    console.log(`  - Initialized: ${isInitialized}`);
    console.log(`  - Bound: ${isBound}`);
    console.log(`  - Version: ${version}`);
    console.log(`  - Content Length: ${yText.length}`);

    const status = getBindingStatus();
    console.log("📊 [UI] Binding Status:", status);
  };

  return (
    <div className="code-editor-wrapper">
      {/* Toolbar */}
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
        onTestYjs={handleTestYjs}
        onDebug={handleDebug}
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
            minimap: { enabled: showMinimap },
            ...editorOptions,
          }}
        />
      </div>

      {/* Status Bar */}
      <EditorStatusBar
        language={language}
        theme={theme}
        isBound={isBound}
        isInitialized={isInitialized}
        cursorPosition={cursorPosition}
        lineCount={lineCount}
        characterCount={characterCount}
        isConnected={isBound}
        connectionStatus={isBound ? "remote" : "local"}
      />
    </div>
  );
};

export default CodeEditor;
