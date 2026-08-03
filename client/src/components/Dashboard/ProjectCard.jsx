import React from "react";
import { useNavigate } from "react-router-dom";

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const openProject = () => {
    navigate(`/room/${project.roomId}`);
  };

  return (
    <div className="project-card">

      <div className="project-top">

        <h3>{project.title}</h3>

        <span className="project-members">
          👥 {project.members} Members
        </span>

      </div>

      <p className="project-description">
        {project.description}
      </p>

      <div className="project-bottom">

        <small>
          Last Edited: {project.lastEdited}
        </small>

        <button
          className="open-project-btn"
          onClick={openProject}
        >
          Open Project →
        </button>

      </div>

    </div>
  );
};

export default ProjectCard;