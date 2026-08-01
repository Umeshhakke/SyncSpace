import React from "react";
import Navbar from "../components/Navbar/Navbar";
import ProfileForm from "../components/Profile/ProfileForm";
import "../styles/profile.css";

/**
 * ProfilePage Component
 * Host page for responsive user profile displaying avatar, username, email, bio, and editing options.
 */
const ProfilePage = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <div className={`profile-page ${isDarkMode ? "dark" : "light"}`}>
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <div className="profile-container">
        <ProfileForm isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default ProfilePage;
