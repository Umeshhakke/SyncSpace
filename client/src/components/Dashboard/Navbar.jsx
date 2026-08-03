import React from "react";

const Navbar = () => {
  return (
    <nav className="dashboard-navbar">

      <div className="dashboard-logo">
        <span className="logo-box">S</span>
        <span>SyncSpace</span>
      </div>

      <div className="dashboard-search">
        <input
          type="text"
          placeholder="Search projects..."
        />
      </div>

      <div className="dashboard-profile">

        <div className="profile-avatar">
          S
        </div>

        <div>

          <h4>Sneha</h4>

          <p>Project Owner</p>

        </div>

      </div>

    </nav>
  );
};

export default Navbar;