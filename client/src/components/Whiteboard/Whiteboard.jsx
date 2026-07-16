import React from "react";
import Toolbar from "./Toolbar";
import "../../styles/whiteboard.css";

const Whiteboard = () => {
  return (
    <div className="whiteboard-container">
      <Toolbar />
      <canvas className="whiteboard-canvas"></canvas>
    </div>
  );
};

export default Whiteboard;
