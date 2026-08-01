import React, { useState } from "react";
import "../../styles/profile.css";

/**
 * ProfileForm Component
 * Renders user profile card with display details, avatar customizer,
 * editable form fields, bio character counter limit (200 chars),
 * loading state, cancel reset, and success/error notifications.
 */
const ProfileForm = ({ isDarkMode }) => {
  // Initial demo user state
  const initialUserData = {
    username: "Alex Morgan",
    email: "alex.morgan@syncspace.io",
    bio: "Senior Full Stack Engineer & open-source contributor. Enthusiastic about real-time collaboration tools and WebAssembly.",
    avatarBg: "#1976d2",
    role: "Core Contributor",
  };

  const avatarColors = [
    "#1976d2",
    "#388e3c",
    "#f57c00",
    "#7b1fa2",
    "#d32f2f",
    "#0097a7",
    "#e91e63",
    "#607d8b",
  ];

  const BIO_MAX_CHARS = 200;

  // Active form states
  const [userData, setUserData] = useState(initialUserData);
  const [formData, setFormData] = useState(initialUserData);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (field, value) => {
    if (field === "bio" && value.length > BIO_MAX_CHARS) {
      return; // Restrict input strictly to BIO_MAX_CHARS
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = "Username cannot be empty.";
    }

    if (!formData.email.trim()) {
      errors.email = "Email cannot be empty.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!validate()) {
      setErrorMessage("Please fix the validation errors below.");
      return;
    }

    setIsLoading(true);

    // Simulate API update call
    setTimeout(() => {
      setIsLoading(false);
      setUserData(formData);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
    }, 1000);
  };

  const handleCancel = () => {
    setFormData(userData);
    setFieldErrors({});
    setSuccessMessage("");
    setErrorMessage("");
    setIsEditing(false);
  };

  const bioLength = formData.bio.length;
  const bioCharRatio = bioLength / BIO_MAX_CHARS;
  let counterClass = "char-counter";
  if (bioCharRatio >= 1) counterClass += " at-limit";
  else if (bioCharRatio >= 0.85) counterClass += " near-limit";

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="profile-card">
      {successMessage && (
        <div className="profile-banner profile-banner-success" role="status">
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="profile-banner profile-banner-error" role="alert">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Header Profile Summary Display */}
      <div className="profile-header-summary">
        <div className="avatar-wrapper">
          <div
            className="profile-avatar-img"
            style={{ backgroundColor: formData.avatarBg }}
            title={formData.username}
          >
            {getInitials(formData.username)}
          </div>

          {isEditing && (
            <div className="avatar-color-picker-group" title="Select Avatar Theme Color">
              {avatarColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.avatarBg === color ? "selected" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleInputChange("avatarBg", color)}
                  aria-label={`Select theme color ${color}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="summary-info">
          <div className="summary-name-row">
            <h2 className="summary-username">{userData.username}</h2>
            <span className="user-role-badge">{userData.role}</span>
          </div>
          <span className="summary-email">✉️ {userData.email}</span>
          <p className="summary-bio">
            {userData.bio || "No bio provided yet. Click edit to add a bio."}
          </p>
        </div>
      </div>

      {/* Form & Editing Section */}
      <div className="profile-form-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="profile-form-title">
            {isEditing ? "Edit Profile Information" : "Account Settings"}
          </h3>
          {!isEditing && (
            <button
              type="button"
              className="btn-update"
              onClick={() => {
                setIsEditing(true);
                setSuccessMessage("");
              }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {isEditing && (
          <form onSubmit={handleUpdate} noValidate>
            <div className="profile-grid-2">
              <div className="profile-field">
                <label className="profile-label" htmlFor="profile-username">
                  Username
                </label>
                <input
                  id="profile-username"
                  type="text"
                  className="profile-input"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  disabled={isLoading}
                />
                {fieldErrors.username && (
                  <span className="field-error">{fieldErrors.username}</span>
                )}
              </div>

              <div className="profile-field">
                <label className="profile-label" htmlFor="profile-email">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="profile-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isLoading}
                />
                {fieldErrors.email && (
                  <span className="field-error">{fieldErrors.email}</span>
                )}
              </div>
            </div>

            <div className="profile-field" style={{ marginTop: "20px" }}>
              <label className="profile-label" htmlFor="profile-bio">
                Bio
              </label>
              <div className="bio-wrapper">
                <textarea
                  id="profile-bio"
                  className="profile-textarea"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  disabled={isLoading}
                />
                <div className="bio-counter-row">
                  {fieldErrors.bio ? (
                    <span className="field-error">{fieldErrors.bio}</span>
                  ) : (
                    <span />
                  )}
                  <span className={counterClass}>
                    {bioLength} / {BIO_MAX_CHARS} characters
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-update" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="auth-spinner" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Profile</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileForm;
