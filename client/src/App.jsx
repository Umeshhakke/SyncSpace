import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import WhiteboardPage from "./pages/WhiteboardPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <Router>
      <SocketProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/room/:roomId" element={<WhiteboardPage initialTab="split" />} />
            <Route path="/whiteboard" element={<WhiteboardPage initialTab="whiteboard" />} />
            <Route path="/editor" element={<WhiteboardPage initialTab="editor" />} />
            <Route path="/split" element={<WhiteboardPage initialTab="split" />} />
            <Route
              path="/login"
              element={<LoginPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
            />
            <Route
              path="/profile"
              element={<ProfilePage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
            />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;

