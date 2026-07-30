import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import '../styles/landing.css';

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

    // Send room join request to the existing Socket.IO backend
    socket.emit('join-room', {
      roomId: trimmedRoom,
      username: trimmedUser,
    });

    // Wait for the backend to return the room participants
    const onParticipants = (data) => {
      setIsJoining(false);

      navigate(`/room/${trimmedRoom}`, {
        state: {
          username: trimmedUser,
          participants: data.participants,
        },
      });
    };

    const onError = (err) => {
      setError(err?.message || 'Failed to join room.');
      setIsJoining(false);
    };

    socket.once('room:participants', onParticipants);
    socket.once('error', onError);
  };

  // Scrolls the user directly to the Join Workspace card
  const scrollToWorkspace = () => {
    document
      .getElementById('workspace')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">

      {/* ================= NAVBAR ================= */}
      <nav className="landing-nav">

        <div className="landing-logo">
          <span className="logo-icon">S</span>
          <span>SyncSpace</span>
        </div>

        <div className="nav-links">

          <a href="#features">
            Features
          </a>

          <a href="#workspace">
            Workspace
          </a>

          <button
            type="button"
            className="nav-cta"
            onClick={scrollToWorkspace}
          >
            Get Started
          </button>

        </div>

      </nav>


      {/* ================= HERO ================= */}
      <main className="hero-section">

        <div className="hero-content">

          <div className="hero-badge">
            Real-time collaborative workspace
          </div>

          <h1>
            Collaborate.
            <br />
            <span>Code. Create.</span>
          </h1>

          <p className="hero-description">
            Bring ideas, diagrams, and code together in one shared workspace.
            SyncSpace lets your team brainstorm, design, and build together
            in real time.
          </p>

          <div className="hero-buttons">

            <button
              type="button"
              className="primary-cta"
              onClick={scrollToWorkspace}
            >
              Start Collaborating
            </button>

            <a
              href="#features"
              className="secondary-cta"
            >
              Explore Features
            </a>

          </div>


          {/* Server connection status */}
          <div className="connection-indicator">

            <span
              className={`status-dot ${
                isConnected ? 'connected' : 'disconnected'
              }`}
            />

            {isConnected
              ? 'Collaboration server connected'
              : 'Connecting to collaboration server...'}

          </div>

        </div>


        {/* ================= WORKSPACE CARD ================= */}

        <div
          className="workspace-card"
          id="workspace"
        >

          <div className="workspace-card-header">

            <span className="workspace-icon">
              ↗
            </span>

            <div>
              <h2>Enter your workspace</h2>
              <p>
                Join your team and start collaborating.
              </p>
            </div>

          </div>


          <form
            onSubmit={handleSubmit}
            className="workspace-form"
          >

            {/* Username */}

            <label htmlFor="username">
              Your name
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alice"
              disabled={isJoining}
              required
            />


            {/* Room ID */}

            <label htmlFor="roomId">
              Room ID
            </label>

            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. Project-Alpha"
              disabled={isJoining}
              required
            />


            {/* Error */}

            {error && (
              <div className="landing-error">
                {error}
              </div>
            )}


            {/* Join button */}

            <button
              type="submit"
              className="join-button"
              disabled={isJoining || !isConnected}
            >

              {isJoining
                ? 'Joining workspace...'
                : 'Join Workspace →'}

            </button>

          </form>


          <p className="workspace-note">
            Share the same Room ID with your teammates to collaborate.
          </p>

        </div>

      </main>


      {/* ================= FEATURES ================= */}

      <section
        className="features-section"
        id="features"
      >

        <div className="section-heading">

          <span>
            BUILT FOR COLLABORATION
          </span>

          <h2>
            Everything your team needs,
            <br />
            in one workspace.
          </h2>

          <p>
            Move seamlessly between visual thinking and collaborative coding.
          </p>

        </div>


        <div className="feature-grid">


          {/* Whiteboard */}

          <article className="feature-card">

            <div className="feature-icon">
              ✦
            </div>

            <h3>
              Collaborative Whiteboard
            </h3>

            <p>
              Draw shapes, diagrams, flows, and ideas together on a
              synchronized canvas.
            </p>

          </article>


          {/* Code editor */}

          <article className="feature-card">

            <div className="feature-icon">
              &lt;/&gt;
            </div>

            <h3>
              Live Code Editor
            </h3>

            <p>
              Write and edit code together with a powerful Monaco-based
              development environment.
            </p>

          </article>


          {/* Synchronization */}

          <article className="feature-card">

            <div className="feature-icon">
              ⚡
            </div>

            <h3>
              Real-Time Synchronization
            </h3>

            <p>
              See changes instantly while Yjs handles concurrent edits
              without overwriting your teammates.
            </p>

          </article>


          {/* Presence */}

          <article className="feature-card">

            <div className="feature-icon">
              ◎
            </div>

            <h3>
              Live Presence
            </h3>

            <p>
              Know who's working with you through shared presence and
              collaboration awareness.
            </p>

          </article>

        </div>

      </section>


      {/* ================= CTA ================= */}

      <section className="bottom-cta">

        <h2>
          Ideas move faster when teams build together.
        </h2>

        <p>
          Create a shared workspace and start collaborating with your team.
        </p>

        <button
          type="button"
          className="primary-cta"
          onClick={scrollToWorkspace}
        >
          Enter SyncSpace
        </button>

      </section>


      {/* ================= FOOTER ================= */}

      <footer className="landing-footer">

        <div className="landing-logo">

          <span className="logo-icon">
            S
          </span>

          <span>
            SyncSpace
          </span>

        </div>

        <p>
          Real-time collaborative whiteboard & code editor.
        </p>

      </footer>

    </div>
  );
};

export default LandingPage;