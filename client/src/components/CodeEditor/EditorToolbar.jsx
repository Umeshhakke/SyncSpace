import React from "react";
import "./codeEditor.css";

/**
 * ============================================
 * EditorToolbar - Professional Editor Controls
 * ============================================
 * Provides controls for:
 * - Language selection
 * - Theme switching (Dark/Light)
 * - Font size adjustment
 * - Tab size configuration
 * - Minimap toggle
 * - Code formatting
 */
const EditorToolbar = ({
  // Editor settings
  language,
  setLanguage,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  tabSize,
  setTabSize,
  showMinimap,
  setShowMinimap,
  // Editor reference for formatting
  editorRef,
  // Yjs status
  isBound,
  isInitialized,
}) => {
  // Languages supported by Monaco
  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "ruby", label: "Ruby" },
    { value: "php", label: "PHP" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
    { value: "sql", label: "SQL" },
    { value: "shell", label: "Shell" },
    { value: "xml", label: "XML" },
    { value: "yaml", label: "YAML" },
  ];

  // Theme options
  const themes = [
    { value: "vs-dark", label: "🌙 Dark" },
    { value: "light", label: "☀️ Light" },
    { value: "hc-black", label: "🔲 High Contrast" },
  ];

  /**
   * Handle language change
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    console.log("📝 [Toolbar] Language changed to:", newLanguage);
  };

  /**
   * Handle theme change
   */
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    console.log("🎨 [Toolbar] Theme changed to:", newTheme);
  };

  /**
   * Handle font size change
   */
  const handleFontSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (newSize >= 8 && newSize <= 40) {
      setFontSize(newSize);
      console.log("📏 [Toolbar] Font size changed to:", newSize);
    }
  };

  /**
   * Handle tab size change
   */
  const handleTabSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (newSize >= 1 && newSize <= 8) {
      setTabSize(newSize);
      console.log("📐 [Toolbar] Tab size changed to:", newSize);
    }
  };

  /**
   * Handle minimap toggle
   */
  const handleMinimapToggle = (e) => {
    setShowMinimap(e.target.checked);
    console.log("🗺️ [Toolbar] Minimap toggled:", e.target.checked);
  };

  /**
   * Format code
   */
  const handleFormatCode = () => {
    if (editorRef?.current) {
      const action = editorRef.current.getAction(
        "editor.action.formatDocument",
      );
      if (action) {
        action.run();
        console.log("✨ [Toolbar] Code formatted");
      } else {
        console.warn(
          "⚠️ [Toolbar] Format action not available for this language",
        );
      }
    } else {
      console.warn("⚠️ [Toolbar] Editor not ready");
    }
  };

  /**
   * Reset all settings to defaults
   */
  const handleResetSettings = () => {
    setLanguage("javascript");
    setTheme("vs-dark");
    setFontSize(15);
    setTabSize(4);
    setShowMinimap(false);
    console.log("🔄 [Toolbar] Settings reset to defaults");
  };

  return (
    <div className="editor-toolbar">
      {/* Language Selector */}
      <div className="toolbar-group">
        <label className="toolbar-label">🌐</label>
        <select
          className="toolbar-select"
          value={language}
          onChange={handleLanguageChange}
          title="Select Programming Language"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-divider"></div>

      {/* Theme Selector */}
      <div className="toolbar-group">
        <label className="toolbar-label">🎨</label>
        <select
          className="toolbar-select"
          value={theme}
          onChange={handleThemeChange}
          title="Select Theme"
        >
          {themes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-divider"></div>

      {/* Font Size */}
      <div className="toolbar-group">
        <label className="toolbar-label">A</label>
        <input
          type="number"
          className="toolbar-input toolbar-input-small"
          min="8"
          max="40"
          value={fontSize}
          onChange={handleFontSizeChange}
          title="Font Size (8-40)"
        />
        <span className="toolbar-unit">px</span>
      </div>

      <div className="toolbar-divider"></div>

      {/* Tab Size */}
      <div className="toolbar-group">
        <label className="toolbar-label">Tab</label>
        <input
          type="number"
          className="toolbar-input toolbar-input-small"
          min="1"
          max="8"
          value={tabSize}
          onChange={handleTabSizeChange}
          title="Tab Size (1-8)"
        />
      </div>

      <div className="toolbar-divider"></div>

      {/* Minimap Toggle */}
      <div className="toolbar-group">
        <label className="toolbar-checkbox">
          <input
            type="checkbox"
            checked={showMinimap}
            onChange={handleMinimapToggle}
            title="Toggle Minimap"
          />
          <span className="checkbox-label">🗺️</span>
        </label>
      </div>

      <div className="toolbar-divider"></div>

      {/* Format Button */}
      <button
        className="toolbar-btn toolbar-btn-format"
        onClick={handleFormatCode}
        title="Format Code (Shift+Alt+F)"
      >
        ✨ Format
      </button>

      {/* Reset Button */}
      <button
        className="toolbar-btn toolbar-btn-reset"
        onClick={handleResetSettings}
        title="Reset to Default Settings"
      >
        🔄 Reset
      </button>

      {/* Status Indicators */}
      <div className="toolbar-status">
        {isBound && (
          <span className="status-badge status-synced">🟢 Synced</span>
        )}
        {isInitialized && !isBound && (
          <span className="status-badge status-ready">🟡 Ready</span>
        )}
        {!isInitialized && (
          <span className="status-badge status-loading">🔴 Loading</span>
        )}
      </div>
    </div>
  );
};

export default EditorToolbar;
