import React, { useState } from "react";

/**
 * Helper to derive language identifier from filename extension
 */
const getLanguageFromFilename = (filename) => {
  if (!filename) return "javascript";
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "java":
      return "java";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "js":
    case "jsx":
    default:
      return "javascript";
  }
};

/**
 * FileExplorer Component
 * Manages real-time multi-file workspace navigation and operations (Create, Rename, Delete, Select).
 */
const FileExplorer = ({
  files = [],
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  isDarkMode = true,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const [editingFileId, setEditingFileId] = useState(null);
  const [editingFileName, setEditingFileName] = useState("");

  const styles = isDarkMode ? darkStyles : lightStyles;

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const derivedLang = getLanguageFromFilename(newFileName.trim());
    if (onCreateFile) {
      onCreateFile(newFileName.trim(), derivedLang);
    }
    setNewFileName("");
    setIsCreating(false);
  };

  const handleRenameSubmit = (e, fileId) => {
    e.preventDefault();
    if (!editingFileName.trim()) return;

    const derivedLang = getLanguageFromFilename(editingFileName.trim());
    if (onRenameFile) {
      onRenameFile(fileId, editingFileName.trim(), derivedLang);
    }
    setEditingFileId(null);
    setEditingFileName("");
  };

  return (
    <div className="file-explorer" style={styles.container}>
      {/* File Explorer Header & Action Controls */}
      <div style={styles.header}>
        <span style={styles.title}>📁 Workspace Files ({files.length})</span>
        <button
          onClick={() => setIsCreating(true)}
          style={styles.addButton}
          title="Create New File"
        >
          + New File
        </button>
      </div>

      {/* New File Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} style={styles.inlineForm}>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="filename.js"
            autoFocus
            style={styles.input}
          />
          <div style={styles.formActions}>
            <button type="submit" style={styles.saveBtn}>
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewFileName("");
              }}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Files List */}
      <div style={styles.fileList}>
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isRenaming = file.id === editingFileId;

          if (isRenaming) {
            return (
              <form
                key={file.id}
                onSubmit={(e) => handleRenameSubmit(e, file.id)}
                style={styles.inlineForm}
              >
                <input
                  type="text"
                  value={editingFileName}
                  onChange={(e) => setEditingFileName(e.target.value)}
                  autoFocus
                  style={styles.input}
                />
                <div style={styles.formActions}>
                  <button type="submit" style={styles.saveBtn}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFileId(null)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile && onSelectFile(file.id)}
              style={{
                ...styles.fileItem,
                ...(isActive ? styles.activeFileItem : {}),
              }}
            >
              <div style={styles.fileLabelGroup}>
                <span style={styles.fileIcon}>📄</span>
                <span style={styles.fileName}>{file.name}</span>
                {isActive && <span style={styles.activeDot}>●</span>}
              </div>

              <div style={styles.fileMetaGroup}>
                <span style={styles.langBadge}>{file.language}</span>

                {/* File Action Controls (Rename & Delete) */}
                <div style={styles.actionButtons}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFileId(file.id);
                      setEditingFileName(file.name);
                    }}
                    style={styles.actionBtn}
                    title="Rename File"
                  >
                    ✏️
                  </button>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteFile) onDeleteFile(file.id);
                      }}
                      style={styles.actionBtn}
                      title="Delete File"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Dark Mode Styling (Fixed width 220px on desktop)
const darkStyles = {
  container: {
    width: "220px",
    minWidth: "220px",
    height: "100%",
    backgroundColor: "#252526",
    borderRight: "1px solid #3c3c3c",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    flexShrink: 0,
  },
  header: {
    padding: "10px 12px",
    borderBottom: "1px solid #3c3c3c",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#cccccc",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  addButton: {
    backgroundColor: "#0e639c",
    color: "#ffffff",
    border: "none",
    borderRadius: "3px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  fileList: {
    flex: 1,
    overflowY: "auto",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#cccccc",
    fontSize: "13px",
    transition: "background-color 0.15s ease",
  },
  activeFileItem: {
    backgroundColor: "#37373d",
    color: "#ffffff",
    fontWeight: "bold",
    borderLeft: "3px solid #007acc",
  },
  fileLabelGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    overflow: "hidden",
  },
  fileIcon: {
    fontSize: "12px",
  },
  fileName: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  activeDot: {
    color: "#007acc",
    fontSize: "10px",
  },
  fileMetaGroup: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  langBadge: {
    fontSize: "10px",
    backgroundColor: "#1e1e1e",
    color: "#00bcd4",
    padding: "1px 5px",
    borderRadius: "6px",
    textTransform: "lowercase",
  },
  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  actionBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    padding: "2px",
    opacity: 0.8,
  },
  inlineForm: {
    padding: "6px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: "#1e1e1e",
    borderRadius: "4px",
    border: "1px solid #007acc",
  },
  input: {
    backgroundColor: "#3c3c3c",
    color: "#ffffff",
    border: "1px solid #555555",
    borderRadius: "3px",
    padding: "4px 6px",
    fontSize: "12px",
    outline: "none",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "6px",
  },
  saveBtn: {
    backgroundColor: "#0e639c",
    color: "#ffffff",
    border: "none",
    borderRadius: "3px",
    padding: "2px 8px",
    fontSize: "11px",
    cursor: "pointer",
  },
  cancelBtn: {
    backgroundColor: "#3c3c3c",
    color: "#cccccc",
    border: "none",
    borderRadius: "3px",
    padding: "2px 8px",
    fontSize: "11px",
    cursor: "pointer",
  },
};

// Light Mode Styling
const lightStyles = {
  container: {
    width: "220px",
    minWidth: "220px",
    height: "100%",
    backgroundColor: "#f3f3f3",
    borderRight: "1px solid #e0e0e0",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    flexShrink: 0,
  },
  header: {
    padding: "10px 12px",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#555555",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  addButton: {
    backgroundColor: "#007acc",
    color: "#ffffff",
    border: "none",
    borderRadius: "3px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  fileList: {
    flex: 1,
    overflowY: "auto",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#333333",
    fontSize: "13px",
    transition: "background-color 0.15s ease",
  },
  activeFileItem: {
    backgroundColor: "#e4e4e4",
    color: "#000000",
    fontWeight: "bold",
    borderLeft: "3px solid #007acc",
  },
  fileLabelGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    overflow: "hidden",
  },
  fileIcon: {
    fontSize: "12px",
  },
  fileName: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  activeDot: {
    color: "#007acc",
    fontSize: "10px",
  },
  fileMetaGroup: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  langBadge: {
    fontSize: "10px",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    padding: "1px 5px",
    borderRadius: "6px",
    textTransform: "lowercase",
  },
  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  actionBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    padding: "2px",
    opacity: 0.8,
  },
  inlineForm: {
    padding: "6px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: "#ffffff",
    borderRadius: "4px",
    border: "1px solid #007acc",
  },
  input: {
    backgroundColor: "#ffffff",
    color: "#333333",
    border: "1px solid #ccc",
    borderRadius: "3px",
    padding: "4px 6px",
    fontSize: "12px",
    outline: "none",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "6px",
  },
  saveBtn: {
    backgroundColor: "#007acc",
    color: "#ffffff",
    border: "none",
    borderRadius: "3px",
    padding: "2px 8px",
    fontSize: "11px",
    cursor: "pointer",
  },
  cancelBtn: {
    backgroundColor: "#e0e0e0",
    color: "#333333",
    border: "none",
    borderRadius: "3px",
    padding: "2px 8px",
    fontSize: "11px",
    cursor: "pointer",
  },
};

export default FileExplorer;
