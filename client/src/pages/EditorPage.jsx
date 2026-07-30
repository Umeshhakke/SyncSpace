import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Whiteboard from '../components/Whiteboard/Whiteboard';  // ✅ Default import

import CodeEditor from '../components/Editor/CodeEditor';

const EditorPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [participants, setParticipants] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });
  
  const username = location.state?.username || 'Guest';

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  // --- Participant tracking ---
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

  // Theme-aware styles
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
          <Whiteboard roomId={roomId} username={username} isDarkMode={isDarkMode} />
        </div>
        <div style={themeStyles.right}>
          <CodeEditor
            roomId={roomId}
            username={username}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
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
  editorPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    transition: 'all 0.3s ease',
  },
  editorContent: {
    textAlign: 'center',
  },
  placeholderBox: {
    marginTop: '1rem',
    padding: '2rem',
    borderRadius: '8px',
    border: '2px dashed',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  },
};

export default EditorPage;
