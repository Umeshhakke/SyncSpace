import { useEffect, useMemo, useState, useCallback } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";

/**
 * ============================================
 * useYjsEditor - Custom Hook for Yjs + Monaco
 * ============================================
 * This hook manages all Yjs and Monaco synchronization logic.
 *
 * Responsibilities:
 * - Create Y.Doc and Y.Text
 * - Bind Monaco Editor to Y.Text
 * - Handle cleanup on unmount
 * - Provide API for networking integration
 *
 * @param {Object} editorRef - React ref containing Monaco editor instance
 * @param {Object} options - Configuration options
 * @param {string} options.roomId - Room ID for collaboration (future use)
 * @param {boolean} options.enableAwareness - Enable cursor sharing (future use)
 * @returns {Object} Yjs document, text, and utility functions
 */
const useYjsEditor = (editorRef, options = {}) => {
  const { roomId = "default", enableAwareness = false } = options;

  const [isBound, setIsBound] = useState(false);
  const [bindingRef, setBindingRef] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [version, setVersion] = useState(0);

  // Create Y.Doc only once using useMemo
  const ydoc = useMemo(() => {
    console.log("🔄 [useYjsEditor] Creating new Y.Doc instance");
    return new Y.Doc();
  }, []);

  // Create Y.Text only once using useMemo
  const yText = useMemo(() => {
    console.log('📝 [useYjsEditor] Creating Y.Text("code") instance');
    return ydoc.getText("code");
  }, [ydoc]);

  /**
   * Initialize document with default content
   */
  useEffect(() => {
    if (!isInitialized && yText.toString() === "") {
      console.log("📝 [useYjsEditor] Initializing Y.Text with default content");

      yText.insert(
        0,
        `function hello() {
  console.log("Welcome to SyncSpace!");
}

// Start coding here...
// This document is shared via Yjs!
`,
      );

      setIsInitialized(true);
      console.log("✅ [useYjsEditor] Document initialized");
    }
  }, [yText, isInitialized]);

  /**
   * Create MonacoBinding when editor is available
   */
  useEffect(() => {
    // Check if editor is available
    if (!editorRef || !editorRef.current) {
      console.log("⏳ [useYjsEditor] Waiting for editor...");
      return;
    }

    const editor = editorRef.current;
    const model = editor.getModel();

    if (!model) {
      console.warn("⚠️ [useYjsEditor] Editor model not available");
      return;
    }

    // Check if already bound to prevent duplicate bindings
    if (isBound) {
      console.log("ℹ️ [useYjsEditor] Already bound, skipping");
      return;
    }

    console.log("🔗 [useYjsEditor] Creating MonacoBinding...");
    console.log(`  - Y.Text length: ${yText.length}`);
    console.log(`  - Model value length: ${model.getValue().length}`);

    try {
      // Create the binding
      const binding = new MonacoBinding(
        yText, // Y.Text shared document
        model, // Monaco editor model
        new Set([editor]), // Set of editors sharing this model
        null, // Awareness (cursor presence) - future use
      );

      setBindingRef(binding);
      setIsBound(true);
      console.log("✅ [useYjsEditor] MonacoBinding created successfully!");
      console.log("🔄 Editor ↔ Y.Text synchronized");

      // Log initial sync state
      const isSynced = yText.toString() === model.getValue();
      console.log(
        `📊 [useYjsEditor] Initial sync: ${isSynced ? "✅ Synced" : "❌ Out of sync"}`,
      );
    } catch (error) {
      console.error("❌ [useYjsEditor] Failed to create MonacoBinding:", error);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (bindingRef) {
        console.log("🗑️ [useYjsEditor] Destroying MonacoBinding...");
        bindingRef.destroy();
        setIsBound(false);
        setBindingRef(null);
        console.log("✅ [useYjsEditor] MonacoBinding destroyed");
      }
    };
  }, [editorRef, yText, isBound]);

  /**
   * Observe changes to Y.Text for debugging and version tracking
   */
  useEffect(() => {
    const handleChange = () => {
      const currentText = yText.toString();
      console.log(
        `📝 [useYjsEditor] Y.Text changed, length: ${currentText.length}`,
      );
      setVersion((prev) => prev + 1);
    };

    yText.observe(handleChange);

    return () => {
      yText.unobserve(handleChange);
      console.log("🔄 [useYjsEditor] Y.Text observer removed");
    };
  }, [yText]);

  /**
   * Log state on mount
   */
  useEffect(() => {
    console.log("📊 [useYjsEditor] Initial State:");
    console.log(`  - Room ID: ${roomId}`);
    console.log(`  - Y.Doc: ${!!ydoc}`);
    console.log(`  - Y.Text: ${!!yText}`);
    console.log(`  - Content Length: ${yText.length}`);
    console.log(`  - Enable Awareness: ${enableAwareness}`);

    // Log all shared types in the document
    const sharedTypes = [];
    ydoc.share.forEach((value, key) => {
      sharedTypes.push(`${key}: ${value.constructor.name}`);
    });
    console.log(`  - Shared Types: ${sharedTypes.join(", ") || "none"}`);
  }, []);

  /**
   * Get the current content of the shared text
   * @returns {string} Current text content
   */
  const getContent = useCallback(() => {
    return yText.toString();
  }, [yText]);

  /**
   * Get the length of the shared text
   * @returns {number} Length of text
   */
  const getLength = useCallback(() => {
    return yText.length;
  }, [yText]);

  /**
   * Insert text at a specific position
   * @param {number} position - Position to insert at
   * @param {string} text - Text to insert
   */
  const insertText = useCallback(
    (position, text) => {
      if (position < 0 || position > yText.length) {
        console.warn(
          "⚠️ [useYjsEditor] Invalid position for insertion:",
          position,
        );
        return false;
      }
      yText.insert(position, text);
      console.log(
        `📝 [useYjsEditor] Inserted text at position ${position}: "${text.substring(0, 20)}..."`,
      );
      return true;
    },
    [yText],
  );

  /**
   * Delete text from a specific position
   * @param {number} position - Starting position
   * @param {number} length - Number of characters to delete
   */
  const deleteText = useCallback(
    (position, length) => {
      if (position < 0 || position + length > yText.length) {
        console.warn(
          "⚠️ [useYjsEditor] Invalid deletion range:",
          position,
          length,
        );
        return false;
      }
      yText.delete(position, length);
      console.log(
        `🗑️ [useYjsEditor] Deleted ${length} characters at position ${position}`,
      );
      return true;
    },
    [yText],
  );

  /**
   * Get the Y.Doc for use with providers
   * @returns {Y.Doc} The Yjs document
   */
  const getDocument = useCallback(() => {
    return ydoc;
  }, [ydoc]);

  /**
   * Get the Y.Text for binding with Monaco
   * @returns {Y.Text} The Yjs text
   */
  const getText = useCallback(() => {
    return yText;
  }, [yText]);

  /**
   * Check if binding is active
   * @returns {boolean} True if binding is active
   */
  const isBindingActive = useCallback(() => {
    return isBound && bindingRef !== null;
  }, [isBound, bindingRef]);

  /**
   * Get binding status for debugging
   * @returns {Object} Binding status information
   */
  const getBindingStatus = useCallback(() => {
    const isSynced =
      yText.toString() === editorRef?.current?.getModel()?.getValue();
    return {
      isBound: isBound,
      isSynced: isSynced,
      yTextLength: yText.length,
      editorLength: editorRef?.current?.getModel()?.getValue()?.length || 0,
      version: version,
    };
  }, [isBound, yText, editorRef, version]);

  /**
   * Force sync between Y.Text and editor
   */
  const forceSync = useCallback(() => {
    if (!isBound || !bindingRef) {
      console.warn("⚠️ [useYjsEditor] Cannot sync: binding not active");
      return false;
    }

    const editor = editorRef?.current;
    if (!editor) {
      console.warn("⚠️ [useYjsEditor] Editor not available");
      return false;
    }

    const model = editor.getModel();
    if (!model) {
      console.warn("⚠️ [useYjsEditor] Model not available");
      return false;
    }

    const currentText = yText.toString();
    const modelText = model.getValue();

    if (currentText !== modelText) {
      console.log("🔄 [useYjsEditor] Force syncing...");
      console.log(`  - Y.Text: ${currentText.length} chars`);
      console.log(`  - Model: ${modelText.length} chars`);

      // Update model from Y.Text
      model.setValue(currentText);
      console.log("✅ [useYjsEditor] Force sync complete");
      return true;
    }

    console.log("✅ [useYjsEditor] Already in sync");
    return true;
  }, [isBound, bindingRef, yText, editorRef]);

  return {
    // Core objects
    ydoc,
    yText,

    // State
    isBound,
    isInitialized,
    version,

    // Read operations
    getContent,
    getLength,
    getDocument,
    getText,

    // Write operations
    insertText,
    deleteText,

    // Debugging
    getBindingStatus,
    isBindingActive,
    forceSync,

    // Room info
    roomId,
  };
};

export default useYjsEditor;
