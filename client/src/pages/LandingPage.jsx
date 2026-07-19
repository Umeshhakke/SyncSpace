import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const LandingPage = () => {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedRoom = roomId.trim();
    const trimmedUser = username.trim();

    if (!trimmedRoom || !trimmedUser) {
      setError('Room ID and Username are required.');
      return;
    }
    if (!socket || !isConnected) {
      setError('Not connected to server.');
      return;
    }

    setIsJoining(true);
    socket.emit('join-room', { roomId: trimmedRoom, username: trimmedUser });

    const onParticipants = (data) => {
      navigate(`/room/${trimmedRoom}`, {
        state: { username: trimmedUser, participants: data.participants },
      });
      setIsJoining(false);
      socket.off('room:participants', onParticipants);
    };

    const onError = (err) => {
      setError(err.message || 'Failed to join.');
      setIsJoining(false);
      socket.off('error', onError);
    };

    socket.once('room:participants', onParticipants);
    socket.once('error', onError);

    setTimeout(() => {
      if (isJoining) {
        setError('Timeout. Please try again.');
        setIsJoining(false);
        socket.off('room:participants', onParticipants);
        socket.off('error', onError);
      }
    }, 5000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎨 SyncSpace</h1>
        <p style={styles.subtitle}>Enter a room to start collaborating</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (e.g. Alice)"
            style={styles.input}
            disabled={isJoining}
            required
          />
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID (e.g. Project-Alpha)"
            style={styles.input}
            disabled={isJoining}
            required
          />
          {error && <div style={styles.error}>{error}</div>}
          <button
            type="submit"
            style={{
              ...styles.button,
              ...(isJoining || !isConnected ? styles.buttonDisabled : {}),
            }}
            disabled={isJoining || !isConnected}
          >
            {isJoining ? 'Joining...' : '🚀 Join Room'}
          </button>
          <div style={styles.status}>
            Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
  },
  card: {
    background: 'white',
    padding: '2.5rem',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '420px',
  },
  title: { margin: '0 0 0.25rem', fontSize: '2rem', textAlign: 'center', color: '#2c3e50' },
  subtitle: { margin: '0 0 2rem', textAlign: 'center', color: '#7f8c8d' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: {
    padding: '0.75rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
  },
  error: { color: '#e74c3c', fontSize: '0.9rem', background: '#fde8e8', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' },
  button: {
    padding: '0.75rem',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonDisabled: { background: '#bdc3c7', cursor: 'not-allowed' },
  status: { textAlign: 'center', fontSize: '0.85rem', color: '#7f8c8d' },
};

export default LandingPage;