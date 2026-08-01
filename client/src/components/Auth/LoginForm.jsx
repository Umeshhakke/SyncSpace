import React, { useState } from "react";
import "../../styles/auth.css";

/**
 * LoginForm Component
 * Handles client-side validation, loading states, remember me preference,
 * password visibility toggling, error banners, and forgot password triggers.
 */
const LoginForm = ({ isDarkMode }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // UI & Validation states
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    if (isSignUp && !name.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError("");
    setInfoMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate backend login authentication delay
    setTimeout(() => {
      setIsLoading(false);
      
      // Demonstration authentication check
      if (email === "error@syncspace.io") {
        setServerError("Invalid credentials. Please check your email and password.");
      } else {
        setInfoMessage(
          isSignUp
            ? `Welcome to SyncSpace, ${name || "User"}! Account created successfully.`
            : `Login successful! Welcome back${rememberMe ? " (Remembered)" : ""}.`
        );
      }
    }, 1200);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setServerError("");
    
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors((prev) => ({
        ...prev,
        email: "Enter a valid email address to receive password reset instructions.",
      }));
      setServerError("Please enter a valid email address first.");
      return;
    }

    setInfoMessage(`Password reset link has been sent to ${email}. Please check your inbox.`);
  };

  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
    setErrors({});
    setServerError("");
    setInfoMessage("");
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2>{isSignUp ? "Create an Account" : "Welcome Back"}</h2>
        <p className="auth-subtitle">
          {isSignUp
            ? "Join SyncSpace for collaborative real-time coding"
            : "Sign in to access your workspace and whiteboards"}
        </p>
      </div>

      {serverError && (
        <div className="auth-banner auth-banner-error" role="alert">
          ⚠️ {serverError}
        </div>
      )}

      {infoMessage && (
        <div className="auth-banner auth-banner-info" role="status">
          ℹ️ {infoMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {isSignUp && (
          <div className="form-field">
            <label className="field-label" htmlFor="name-input">
              Full Name
            </label>
            <div className="input-wrapper">
              <input
                id="name-input"
                type="text"
                className={`auth-input ${errors.name ? "has-error" : ""}`}
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                disabled={isLoading}
              />
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
        )}

        <div className="form-field">
          <label className="field-label" htmlFor="email-input">
            Email Address
          </label>
          <div className="input-wrapper">
            <input
              id="email-input"
              type="email"
              className={`auth-input ${errors.email ? "has-error" : ""}`}
              placeholder="user@syncspace.io"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              disabled={isLoading}
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="password-input">
            Password
          </label>
          <div className="input-wrapper">
            <input
              id="password-input"
              type={showPassword ? "text" : "password"}
              className={`auth-input password-input ${errors.password ? "has-error" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        {!isSignUp && (
          <div className="auth-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </div>
        )}

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="auth-spinner" />
              <span>{isSignUp ? "Creating Account..." : "Logging In..."}</span>
            </>
          ) : (
            <span>{isSignUp ? "Create Account" : "Log In"}</span>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <span>{isSignUp ? "Already have an account?" : "Don't have an account?"}</span>
        <button type="button" className="auth-footer-link" onClick={toggleAuthMode}>
          {isSignUp ? "Log In" : "Create Account"}
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
