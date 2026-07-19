import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Whiteboard from '../components/whiteboard/Whiteboard'; // 👈 YOUR existing whiteboard

// Temporary Code Editor placeholder (Member 4 will replace this)
const CodeEditorPlaceholder = ({ roomId, username }) => (
  <div style={styles.editorPlaceholder}>
    <h3 style={{ color: '#ecf0f1' }}>📝 Code Editor</h3>
    <p style={{ color: '#95a5a6' }}>Room: <strong style={{ color: '#ecf0f1' }}>{roomId}</strong></p>
    <p style={{ color: '#95a5a6' }}>User: <strong style={{ color: '#ecf0f1' }}>{username}</strong></p>
    <div style={styles.placeholderBox}>⬅️ Member 4 builds Code Editor here</div>
  </div>
);

const EditorPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [participants, setParticipants] = useState([]);
  const username = location.state?.username || 'Guest';

  // --- Participant tracking (uses your existing socket events) ---
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.headerTitle}>🎨 Room: {roomId}</h2>
          <span style={styles.badge}>👤 {username}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.count}>👥 {participants.length} online</span>
          <button onClick={handleLeave} style={styles.leaveBtn}>🚪 Leave</button>
        </div>
      </header>

      {/* Split Screen: Whiteboard (Left) | Code Editor (Right) */}
      <div style={styles.split}>
        <div style={styles.left}>
          {/* 👇 YOUR EXISTING WHITEBOARD COMPONENT - now gets roomId & username */}
          <Whiteboard roomId={roomId} username={username} />
        </div>
        <div style={styles.right}>
          <CodeEditorPlaceholder roomId={roomId} username={username} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f0f2f5' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 2rem',
    background: 'white',
    borderBottom: '2px solid #e0e0e0',
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  headerTitle: { margin: 0, fontSize: '1.2rem', color: '#2c3e50' },
  badge: { background: '#667eea', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  count: { fontSize: '0.9rem', color: '#2c3e50' },
  leaveBtn: { background: '#e74c3c', color: 'white', border: 'none', padding: '0.4rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  split: { display: 'flex', flex: 1, overflow: 'hidden' },
  left: { flex: 1, background: 'white', borderRight: '2px solid #e0e0e0', overflow: 'hidden' },
  right: { flex: 1, background: '#1e1e2f', overflow: 'hidden' },
  editorPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#1e1e2f', padding: '1rem' },
  placeholderBox: { marginTop: '1rem', padding: '2rem', background: '#2c3e50', borderRadius: '8px', border: '2px dashed #7f8c8d', fontSize: '1.2rem', fontWeight: 'bold', color: '#bdc3c7' },
};

export default EditorPage;