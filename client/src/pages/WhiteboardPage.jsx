import React from "react";
import Whiteboard from "../components/Whiteboard/Whiteboard";

const WhiteboardPage = ({ initialTab }) => {
  return (
    <div className="whiteboard-page">
      <Whiteboard initialTab={initialTab} />
    </div>
  );
};

export default WhiteboardPage;
