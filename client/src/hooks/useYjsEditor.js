import { useMemo, useEffect, useRef, useState } from "react";
import * as Y from "yjs";

/**
 * ============================================
 * useYjsEditor - Yjs Document Management Hook
 * ============================================
 * This hook creates and manages a Yjs document
 * for collaborative editing.
 *
 * Key Concepts:
 * - Y.Doc: The shared document container
 * - Y.Text: A shared text object within the document
 * - useMemo: Ensures document is created only once
 *
 * @returns {Object} Yjs document and text objects
 */
const useYjsEditor = () => {
  // Create Y.Doc only once using useMemo
  const ydoc = useMemo(() => {
    console.log("🔄 Creating new Y.Doc instance");
    return new Y.Doc();
  }, []);

  // Create Y.Text only once using useMemo
  const yText = useMemo(() => {
    console.log('📝 Creating Y.Text("code") instance');
    return ydoc.getText("code");
  }, [ydoc]);

  // Track if document is initialized
  const [isInitialized, setIsInitialized] = useState(false);

  // Track version for debugging
  const [version, setVersion] = useState(0);

  // Initialize document with default content on first mount
  useEffect(() => {
    if (!isInitialized && yText.toString() === "") {
      console.log("📝 Initializing Y.Text with default content");

      // Insert default content
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
      console.log("✅ Yjs document initialized");
    }
  }, [yText, isInitialized]);

  // Listen for changes on the Y.Text
  useEffect(() => {
    const handleChange = () => {
      const currentText = yText.toString();
      console.log("📝 Y.Text changed, length:", currentText.length);
      setVersion((prev) => prev + 1);
    };

    // Observe changes to the Y.Text
    yText.observe(handleChange);

    // Cleanup observer on unmount
    return () => {
      yText.unobserve(handleChange);
      console.log("🔄 Y.Text observer removed");
    };
  }, [yText]);

  // Log document state on mount
  useEffect(() => {
    console.log("📊 Yjs Document State:");
    console.log("  - Y.Doc:", ydoc);
    console.log("  - Y.Text:", yText);
    console.log(
      "  - Initial Content:",
      yText.toString().substring(0, 50) + "...",
    );
    console.log("  - Content Length:", yText.length);

    // Log all shared types in the document
    console.log("📊 Shared Types in Y.Doc:");
    ydoc.share.forEach((value, key) => {
      console.log(`  - ${key}: ${value.constructor.name}`);
    });
  }, []);

  /**
   * Get the current content of the shared text
   * @returns {string} Current text content
   */
  const getContent = () => {
    return yText.toString();
  };

  /**
   * Get the length of the shared text
   * @returns {number} Length of text
   */
  const getLength = () => {
    return yText.length;
  };

  /**
   * Insert text at a specific position
   * @param {number} position - Position to insert at
   * @param {string} text - Text to insert
   */
  const insertText = (position, text) => {
    if (position < 0 || position > yText.length) {
      console.warn("⚠️ Invalid position for insertion:", position);
      return;
    }
    yText.insert(position, text);
    console.log(`📝 Inserted text at position ${position}: "${text}"`);
  };

  /**
   * Delete text from a specific position
   * @param {number} position - Starting position
   * @param {number} length - Number of characters to delete
   */
  const deleteText = (position, length) => {
    if (position < 0 || position + length > yText.length) {
      console.warn("⚠️ Invalid deletion range:", position, length);
      return;
    }
    yText.delete(position, length);
    console.log(`🗑️ Deleted ${length} characters at position ${position}`);
  };

  /**
   * Get the Y.Doc for use with providers
   * @returns {Y.Doc} The Yjs document
   */
  const getDocument = () => {
    return ydoc;
  };

  /**
   * Get the Y.Text for binding with Monaco
   * @returns {Y.Text} The Yjs text
   */
  const getText = () => {
    return yText;
  };

  return {
    ydoc, // The shared document
    yText, // The shared text
    isInitialized, // Whether document is initialized
    version, // Version counter for changes
    getContent, // Get current text content
    getLength, // Get text length
    insertText, // Insert text at position
    deleteText, // Delete text at position
    getDocument, // Get Y.Doc for providers
    getText, // Get Y.Text for binding
  };
};

export default useYjsEditor;
