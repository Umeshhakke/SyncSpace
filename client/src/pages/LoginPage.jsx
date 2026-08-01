import React from "react";
import Navbar from "../components/Navbar/Navbar";
import LoginForm from "../components/Auth/LoginForm";
import "../styles/auth.css";

/**
 * LoginPage Component
 * Host page for modern responsive login UI supporting light and dark theme mode.
 */
const LoginPage = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <div className={`auth-page ${isDarkMode ? "dark" : "light"}`}>
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <div className="auth-container">
        <LoginForm isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default LoginPage;
