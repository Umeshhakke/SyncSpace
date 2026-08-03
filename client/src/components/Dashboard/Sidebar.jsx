import React from "react";

const Sidebar = () => {
  return (
    <aside className="dashboard-sidebar">

      <h3>Navigation</h3>

      <ul>

        <li className="active">
          📊 Dashboard
        </li>

        <li>
          📁 My Projects
        </li>

        <li>
          ⭐ Favorites
        </li>

        <li>
          ⚙ Settings
        </li>

        <li>
          🚪 Logout
        </li>

      </ul>

    </aside>
  );
};

export default Sidebar;