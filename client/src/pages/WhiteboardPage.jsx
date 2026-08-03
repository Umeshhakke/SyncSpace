import React from "react";
import { useParams, useLocation } from "react-router-dom";
import Whiteboard from "../components/Whiteboard/Whiteboard";

const WhiteboardPage = ({ initialTab }) => {
  const { roomId } = useParams();
  const location = useLocation();

  const activeRoomId = roomId || "default-room";
  const activeUsername =
    location.state?.username ||
    "Collaborator-" + Math.floor(Math.random() * 1000);

  return (
    <div className="whiteboard-page">
      <Whiteboard
        roomId={activeRoomId}
        username={activeUsername}
        initialTab={initialTab}
      />
    </div>
  );
};

export default WhiteboardPage;
