import React from "react";
import Navbar from "../components/Dashboard/Navbar";
import Sidebar from "../components/Dashboard/Sidebar";
import ProjectCard from "../components/Dashboard/ProjectCard";
import RecentActivity from "../components/Dashboard/RecentActivity";

import "../styles/dashboard.css";

const projects = [
   {
    id: 1,
    roomId: "project-alpha",
    title: "Project Alpha",
    description: "Collaborative AI Whiteboard",
    members: 4,
    lastEdited: "2 hours ago",
  },
  {
    id: 2,
    roomId: "research-room",
    title: "Research Room",
    description: "Medical AI Discussion",
    members: 3,
    lastEdited: "Yesterday",
  },
  {
    id: 3,
    roomId: "hackathon-final",
    title: "Hackathon",
    description: "SyncSpace Final Project",
    members: 6,
    lastEdited: "Just now",
  },
];

const DashboardPage = () => {
  return (
    <div className="dashboard">

      <Navbar />

      <div className="dashboard-body">

        <Sidebar />

        <main className="dashboard-content">

          <div className="dashboard-header">

            <h1>Welcome Back 👋</h1>

            <p>
              Access all your collaborative workspaces from one place.
            </p>

          </div>
          <section className="dashboard-stats">

  <div className="stat-card">
    <h3>Total Projects</h3>
    <span>{projects.length}</span>
  </div>

  <div className="stat-card">
    <h3>Active Projects</h3>
    <span>2</span>
  </div>

  <div className="stat-card">
    <h3>Team Members</h3>
    <span>13</span>
  </div>

  <button
  className="create-project-btn"
  onClick={() => alert("Create Project feature coming soon!")}
>
  + Create Project
</button>

</section>

          <section className="projects-section">

            <h2>Your Projects</h2>

            <div className="project-grid">

              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                />
              ))}

            </div>

          </section>

          <RecentActivity />

        </main>

      </div>

    </div>
  );
};

export default DashboardPage;