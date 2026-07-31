import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WhiteboardPage from "./pages/WhiteboardPage";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WhiteboardPage initialTab="whiteboard" />} />
          <Route path="/whiteboard" element={<WhiteboardPage initialTab="whiteboard" />} />
          <Route path="/editor" element={<WhiteboardPage initialTab="editor" />} />
          <Route path="*" element={<WhiteboardPage initialTab="whiteboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
