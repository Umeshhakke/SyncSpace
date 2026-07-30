import React, { useEffect, useState, useRef } from 'react';
import useYjs from '../../hooks/useYjs';

const CodeEditor = ({ roomId, username, isDarkMode }) => {
  const { doc, provider, awareness, codeText, synced } = useYjs(roomId);
  const [text, setText] = useState('');
  const localChangeRef = useRef(false);

  // Initialize local text from shared Y.Text when available
  useEffect(() => {
    if (!codeText) return;
    try {
      const initial = codeText.toString();
      setText(initial);
    } catch (e) {
      // ignore
    }

    // Observe remote changes and update local text
    const observer = (event) => {
      // Avoid applying when change originated locally (we still allow remote updates to reflect)
      if (localChangeRef.current) {
        // reset marker; local update already applied
        localChangeRef.current = false;
        return;
      }
      setText(codeText.toString());
    };

    codeText.observe(observer);

    return () => {
      try {
        codeText.unobserve(observer);
      } catch (e) {}
    };
  }, [codeText]);

  // Set awareness local state (user info)
  useEffect(() => {
    if (!awareness) return;
    const user = { name: username || 'Guest' };
    awareness.setLocalStateField('user', user);
  }, [awareness, username]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setText(newVal);

    if (!codeText || !doc) return;

    // Mark this as local change so observer can ignore the echo
    localChangeRef.current = true;

    // Replace entire text atomically
    doc.transact(() => {
      try {
        // delete full current content and insert the new one
        const len = codeText.toString().length || 0;
        if (len > 0) codeText.delete(0, len);
        if (newVal.length > 0) codeText.insert(0, newVal);
      } catch (err) {
        // fallback: set text via replace
        // console.warn('Yjs text update failed', err);
      }
    });
  };

  const editorStyle = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    padding: '1rem',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
    fontSize: '0.95rem',
    lineHeight: '1.45',
    background: isDarkMode ? '#0b1220' : '#ffffff',
    color: isDarkMode ? '#d6deff' : '#0b1220',
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: `1px solid ${isDarkMode ? '#202630' : '#ececec'}`, background: isDarkMode ? '#0d1420' : '#fafafa' }}>
        <div>
          <strong style={{ fontSize: '0.95rem' }}>Collaborative Code Editor</strong>
          <span style={{ marginLeft: '0.6rem', color: isDarkMode ? '#9aa4c1' : '#6b7280' }}>{roomId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: synced ? '#2ecc71' : '#e74c3c' }} title={synced ? 'Connected' : 'Disconnected'} />
          <span style={{ color: isDarkMode ? '#9aa4c1' : '#6b7280', fontSize: '0.85rem' }}>{synced ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        spellCheck={false}
        style={editorStyle}
      />
    </div>
  );
};

export default CodeEditor;
