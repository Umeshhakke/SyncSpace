import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="dashboard-navbar">

      <Link to="/" className="dashboard-logo" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="logo-box">S</span>
        <span>SyncSpace</span>
      </Link>

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