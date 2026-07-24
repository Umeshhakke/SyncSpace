import React from "react";
import Header from "../Header/Header";
import Whiteboard from "../Whiteboard/Whiteboard";
import CodeEditor from "../CodeEditor/CodeEditor";
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
          <div className="editor-container">
            <CodeEditor />
          </div>
          <ParticipantSidebar />
        </div>
      </div>
    </div>
  );
};

export default SplitLayout;
