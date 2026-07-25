/**
 * ============================================
 * Editor Configuration - Centralized Settings
 * ============================================
 * All Monaco Editor options are centralized here
 * for easy maintenance and consistency.
 *
 * @module editorConfig
 */

/**
 * Default editor options for Monaco
 */
export const editorOptions = {
  // Layout
  automaticLayout: true,

  // Font
  fontSize: 15,
  fontFamily: 'Consolas, "Courier New", monospace',

  // Indentation
  tabSize: 4,
  insertSpaces: true,

  // Word wrap
  wordWrap: "on",
  scrollBeyondLastLine: false,

  // Minimap
  minimap: {
    enabled: false,
  },

  // Selection & Cursor
  roundedSelection: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: true,

  // Formatting
  formatOnPaste: true,
  formatOnType: true,

  // Line numbers
  lineNumbers: "on",
  renderWhitespace: "selection",

  // Brackets
  bracketPairColorization: {
    enabled: true,
  },
  matchBrackets: "always",

  // Folding
  folding: true,
  foldingStrategy: "indentation",

  // Suggestion
  suggest: {
    showKeywords: true,
    showSnippets: true,
    showFunctions: true,
    showClasses: true,
  },

  // Smooth scrolling
  smoothScrolling: true,

  // Accessibility
  accessibilitySupport: "on",
};

/**
 * Theme configurations
 */
export const themes = {
  dark: {
    id: "syncspace-dark",
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
      { token: "type", foreground: "8be9fd" },
      { token: "class", foreground: "ffb86c" },
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
      "editorBracketMatch.background": "#313244",
      "editorBracketMatch.border": "#6c7086",
    },
  },
  light: {
    id: "syncspace-light",
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6a737d" },
      { token: "keyword", foreground: "d73a49" },
      { token: "string", foreground: "032f62" },
      { token: "number", foreground: "005cc5" },
      { token: "function", foreground: "6f42c1" },
      { token: "variable", foreground: "24292e" },
      { token: "operator", foreground: "d73a49" },
      { token: "type", foreground: "005cc5" },
      { token: "class", foreground: "6f42c1" },
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
      "editorBracketMatch.background": "#d0d7de",
      "editorBracketMatch.border": "#6a737d",
    },
  },
  highContrast: {
    id: "syncspace-hc",
    base: "hc-black",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#000000",
      "editor.foreground": "#ffffff",
      "editor.lineHighlightBackground": "#1e1e1e",
      "editor.selectionBackground": "#3a3a3a",
      "editor.lineNumber.foreground": "#6c6c6c",
      "editor.lineNumber.activeForeground": "#ffffff",
    },
  },
};

/**
 * Supported languages
 */
export const supportedLanguages = [
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

/**
 * Theme options for toolbar
 */
export const themeOptions = [
  { value: "vs-dark", label: "🌙 Dark" },
  { value: "light", label: "☀️ Light" },
  { value: "hc-black", label: "🔲 High Contrast" },
];

/**
 * Default editor settings
 */
export const defaultSettings = {
  language: "javascript",
  theme: "vs-dark",
  fontSize: 15,
  tabSize: 4,
  showMinimap: false,
};
