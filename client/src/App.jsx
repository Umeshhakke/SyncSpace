import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WhiteboardPage from "./pages/WhiteboardPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WhiteboardPage initialTab="whiteboard" />} />
          <Route path="/whiteboard" element={<WhiteboardPage initialTab="whiteboard" />} />
          <Route path="/editor" element={<WhiteboardPage initialTab="editor" />} />
          <Route
            path="/login"
            element={<LoginPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
          />
          <Route
            path="/profile"
            element={<ProfilePage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
          />
          <Route path="*" element={<WhiteboardPage initialTab="whiteboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

