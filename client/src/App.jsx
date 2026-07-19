import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import LandingPage from './pages/LandingPage';
import EditorPage from './pages/EditorPage';
// If you have other imports, keep them

function App() {
  return (
    <Router>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/room/:roomId" element={<EditorPage />} />
        </Routes>
      </SocketProvider>
    </Router>
  );
}

export default App;