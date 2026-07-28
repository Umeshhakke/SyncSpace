import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { YjsProvider } from '../context/YjsContext';        // ← NEW
import Whiteboard from '../components/Whiteboard/Whiteboard';
import { CodeEditor } from '../components/CodeEditor';      // ← NEW (instead of placeholder)

const EditorPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [participants, setParticipants] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  const username = location.state?.username || 'Guest';

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  // --- Participant tracking (unchanged) ---
  useEffect(() => {
    if (!socket) return;
    if (location.state?.participants) setParticipants(location.state.participants);

    socket.on('user-joined', (data) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, username: data.username }];
      });
    });

    socket.on('user-left', (data) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    });

    socket.on('room:participants', (data) => {
      setParticipants(data.participants);
    });

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room:participants');
    };
  }, [socket, location.state]);

  const handleLeave = () => {
    if (socket) {
      socket.emit('leave-room');
      socket.once('left-room', () => navigate('/'));
    }
  };

  // Theme-aware styles (unchanged)
  const themeStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: isDarkMode ? '#0d1117' : '#f0f2f5',
      transition: 'background 0.3s ease',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.6rem 2rem',
      background: isDarkMode ? '#161b22' : '#ffffff',
      borderBottom: `2px solid ${isDarkMode ? '#30363d' : '#e9ecef'}`,
      flexShrink: 0,
      flexWrap: 'wrap',
      gap: '0.5rem',
      transition: 'all 0.3s ease',
    },
    headerTitle: {
      margin: 0,
      fontSize: '1.1rem',
      color: isDarkMode ? '#f0f6fc' : '#2c3e50',
      fontWeight: 600,
    },
    badge: {
      background: isDarkMode ? '#30363d' : '#667eea',
      color: isDarkMode ? '#f0f6fc' : 'white',
      padding: '0.2rem 0.8rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: 600,
    },
    count: {
      fontSize: '0.85rem',
      color: isDarkMode ? '#8b949e' : '#2c3e50',
    },
    leaveBtn: {
      background: isDarkMode ? '#da3633' : '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '0.35rem 1.2rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.85rem',
      transition: 'opacity 0.2s',
      ':hover': { opacity: 0.85 },
    },
    themeBtn: {
      background: isDarkMode ? '#30363d' : '#e9ecef',
      color: isDarkMode ? '#f0f6fc' : '#2c3e50',
      border: 'none',
      padding: '0.35rem 0.8rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'all 0.2s',
    },
    split: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    left: {
      flex: 1,
      background: isDarkMode ? '#0d1117' : '#ffffff',
      borderRight: `2px solid ${isDarkMode ? '#30363d' : '#e9ecef'}`,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    },
    right: {
      flex: 1,
      background: isDarkMode ? '#0d1117' : '#f8f9fa',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    },
  };

  return (
    // 🔥 WRAP EVERYTHING WITH YjsProvider
    <YjsProvider roomId={roomId}>
      <div style={themeStyles.container}>
        {/* Header */}
        <header style={themeStyles.header}>
          <div style={styles.headerLeft}>
            <h2 style={themeStyles.headerTitle}>
              <span style={{ marginRight: '0.5rem' }}>🎨</span>
              {roomId}
            </h2>
            <span style={themeStyles.badge}>👤 {username}</span>
          </div>
          <div style={styles.headerRight}>
            <span style={themeStyles.count}>👥 {participants.length} online</span>
            <button
              onClick={toggleTheme}
              style={themeStyles.themeBtn}
              title="Toggle Theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLeave}
              style={themeStyles.leaveBtn}
              onMouseEnter={(e) => e.target.style.opacity = '0.85'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              🚪 Leave
            </button>
          </div>
        </header>

        {/* Split Screen: Whiteboard (Left) | Code Editor (Right) */}
        <div style={themeStyles.split}>
          <div style={themeStyles.left}>
            {/* 🔥 REMOVE roomId prop – Whiteboard now gets Yjs from context */}
            <Whiteboard username={username} isDarkMode={isDarkMode} />
          </div>
          <div style={themeStyles.right}>
            {/* 🔥 REPLACE placeholder with real CodeEditor */}
            <CodeEditor />
          </div>
        </div>
      </div>
    </YjsProvider>
  );
};

const styles = {
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
};

export default EditorPage;