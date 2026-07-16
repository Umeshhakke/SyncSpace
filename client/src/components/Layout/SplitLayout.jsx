import React from "react";
import Whiteboard from "../Whiteboard/Whiteboard";
import "../../styles/layout.css";

const SplitLayout = () => {
  return (
    <div className="split-layout">
      {/* Left Panel - Whiteboard Section */}
      <div className="left-panel">
        <Whiteboard />
      </div>

      {/* Right Panel - Code Editor Section */}
      <div className="right-panel">
        <div className="panel-content">
          <div className="panel-icon"></div>
          <h2>Code Editor</h2>
          <p>Real-time collaborative coding</p>
          <div className="panel-placeholder">
            <span>Ready to code</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitLayout;
