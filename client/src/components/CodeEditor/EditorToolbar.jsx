import React from "react";
import { supportedLanguages, themeOptions } from "../../utils/editorConfig";
import "./codeEditor.css";

const EditorToolbar = ({
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
  editorRef,
  isBound,
  isInitialized,
  onTestYjs,
  onDebug,
}) => {
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    console.log("📝 [Toolbar] Language changed to:", e.target.value);
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    console.log("🎨 [Toolbar] Theme changed to:", e.target.value);
  };

  const handleFontSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (newSize >= 8 && newSize <= 40) {
      setFontSize(newSize);
      console.log("📏 [Toolbar] Font size changed to:", newSize);
    }
  };

  const handleTabSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (newSize >= 1 && newSize <= 8) {
      setTabSize(newSize);
      console.log("📐 [Toolbar] Tab size changed to:", newSize);
    }
  };

  const handleMinimapToggle = (e) => {
    setShowMinimap(e.target.checked);
    console.log("🗺️ [Toolbar] Minimap toggled:", e.target.checked);
  };

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
    }
  };

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
        >
          {supportedLanguages.map((lang) => (
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
        >
          {themeOptions.map((t) => (
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
          />
          <span className="checkbox-label">🗺️</span>
        </label>
      </div>

      <div className="toolbar-divider"></div>

      {/* Format Button */}
      <button
        className="toolbar-btn toolbar-btn-format"
        onClick={handleFormatCode}
      >
        ✨ Format
      </button>

      {/* Test Button */}
      <button className="toolbar-btn toolbar-btn-test" onClick={onTestYjs}>
        📝 Test
      </button>

      {/* Debug Button */}
      <button className="toolbar-btn toolbar-btn-debug" onClick={onDebug}>
        📊 Debug
      </button>

      {/* Reset Button */}
      <button
        className="toolbar-btn toolbar-btn-reset"
        onClick={handleResetSettings}
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
