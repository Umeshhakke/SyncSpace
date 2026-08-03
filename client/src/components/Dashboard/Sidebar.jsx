import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="dashboard-sidebar">

      <h3>Navigation</h3>

      <ul>

        <li className="active">
          <Link to="/dashboard" style={{ color: "inherit", textDecoration: "none", display: "block" }}>📊 Dashboard</Link>
        </li>

        <li>
          <Link to="/" style={{ color: "inherit", textDecoration: "none", display: "block" }}>⚡ Join Workspace</Link>
        </li>

        <li>
          <Link to="/whiteboard" style={{ color: "inherit", textDecoration: "none", display: "block" }}>🎨 Whiteboard</Link>
        </li>

        <li>
          <Link to="/editor" style={{ color: "inherit", textDecoration: "none", display: "block" }}>💻 Code Editor</Link>
        </li>

        <li>
          <Link to="/profile" style={{ color: "inherit", textDecoration: "none", display: "block" }}>⚙ Profile & Settings</Link>
        </li>

      </ul>

    </aside>
  );
};

export default Sidebar;