import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/navbar.css";

/**
 * Navbar Component
 * Shared application navigation header with dark/light mode toggle and responsive mobile menu.
 */
const Navbar = ({ isDarkMode, setIsDarkMode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`syncspace-navbar ${isDarkMode ? "dark" : "light"}`}>
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">⚡</div>
        <span className="brand-text">SyncSpace</span>
      </Link>

      <div className="navbar-actions">
        <button
          className="theme-toggle-btn"
          onClick={() => setIsDarkMode && setIsDarkMode((prev) => !prev)}
          title="Toggle Theme"
          type="button"
        >
          {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          type="button"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      <div className={`navbar-links ${mobileMenuOpen ? "open" : ""}`}>
        <Link
          to="/whiteboard"
          className={`nav-item ${isActive("/whiteboard") || isActive("/") ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          🎨 Whiteboard
        </Link>
        <Link
          to="/editor"
          className={`nav-item ${isActive("/editor") ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          💻 Code Editor
        </Link>
        <Link
          to="/login"
          className={`nav-item ${isActive("/login") ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          🔐 Login
        </Link>
        <Link
          to="/profile"
          className={`nav-item ${isActive("/profile") ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          👤 Profile
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
