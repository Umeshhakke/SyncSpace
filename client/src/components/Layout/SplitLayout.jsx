import React from "react";
import Header from "../Header/Header";
import Whiteboard from "../Whiteboard/Whiteboard";
import ParticipantSidebar from "../Participants/ParticipantSidebar";
import "../../styles/layout.css";

const SplitLayout = () => {
  return (
    <div className="app-container">
      <Header />

      <div className="split-layout">
        {/* Left Panel - Whiteboard Section */}
        <div className="left-panel">
          <Whiteboard />
        </div>

        {/* Right Panel - Code Editor & Participants */}
        <div className="right-panel">
          {/* Code Editor Placeholder */}
          <div className="code-editor-placeholder">
            <div className="panel-content">
              <div className="panel-icon">💻</div>
              <h2>Code Editor</h2>
              <p>Real-time collaborative coding</p>
              <div className="panel-placeholder">
                <span>Ready to code</span>
              </div>
            </div>
          </div>

          {/* Participant Sidebar */}
          <ParticipantSidebar />
        </div>
      </div>
    </div>
  );
};

export default SplitLayout;
