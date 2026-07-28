import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { useYjs } from '../context/YjsContext';

export const CodeEditor = () => {
  // All hooks are called unconditionally at the top
  const editorRef = useRef(null);
  const yTextRef = useRef(null);
  const isLocalChange = useRef(false);
  const yjs = useYjs();

  // Cleanup effect – moved BEFORE any conditional return
  useEffect(() => {
    return () => {
      // optional cleanup (if needed)
    };
  }, []);

  // Now we can safely conditionally return early
  if (!yjs) {
    return <div style={{ color: '#fff', padding: '1rem' }}>Connecting...</div>;
  }

  const { doc, provider, awareness } = yjs;

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    const yText = doc.getText('code-content');
    yTextRef.current = yText;

    const model = editor.getModel();
    if (!model) return;

    // Initial sync
    const currentContent = model.getValue();
    if (yText.length === 0 && currentContent === '') {
      yText.insert(0, '// Welcome to SyncSpace collaborative code editor!\n// Start typing...');
    } else if (yText.length > 0 && currentContent !== yText.toString()) {
      model.setValue(yText.toString());
    }

    // Local → Yjs
    const localChangeDisposable = editor.onDidChangeModelContent(() => {
      if (isLocalChange.current) return;
      const newValue = model.getValue();
      const yTextValue = yText.toString();
      if (newValue !== yTextValue) {
        isLocalChange.current = true;
        yText.delete(0, yText.length);
        yText.insert(0, newValue);
        isLocalChange.current = false;
      }
    });

    // Yjs → Local
    const yTextObserver = () => {
      if (isLocalChange.current) return;
      const remoteValue = yText.toString();
      const currentValue = model.getValue();
      if (remoteValue !== currentValue) {
        isLocalChange.current = true;
        model.setValue(remoteValue);
        isLocalChange.current = false;
      }
    };
    yText.observe(yTextObserver);

    // Cursor awareness – use 'codeCursor' to avoid conflict with whiteboard
    const updateCursor = () => {
      const position = editor.getPosition();
      if (position) {
        awareness.setLocalStateField('codeCursor', {
          lineNumber: position.lineNumber,
          column: position.column,
        });
      }
    };
    editor.onDidChangeCursorPosition(updateCursor);
    updateCursor();

    // Cleanup
    return () => {
      localChangeDisposable.dispose();
      yText.unobserve(yTextObserver);
    };
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#1e1e1e' }}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          automaticLayout: true,
        }}
      />
    </div>
  );
};