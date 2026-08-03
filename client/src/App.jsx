import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { SocketProvider } from "./context/SocketContext";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";

function App() {
  return (
    <Router>
      <SocketProvider>
        <Routes>

          {/* Landing Page */}
          <Route
            path="/"
            element={<LandingPage />}
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          {/* Collaborative Workspace */}
          <Route
            path="/room/:roomId"
            element={<EditorPage />}
          />

        </Routes>
      </SocketProvider>
    </Router>
  );
}

export default App;