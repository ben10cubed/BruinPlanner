import React, { useState, useRef } from "react";
import "../Authentication.css";

export default function SignupPage({ onSignup, onLoginPage }) {
  const usernameRef = useRef();
  const passwordRef = useRef();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const username = usernameRef.current.value;
    const password = passwordRef.current.value;

    if (!username) {
      setError("Please enter a valid username.");
      return;
    }

    if (!password) {
      setError("Please enter a valid password.");
      return;
    }

    try {
      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setSuccess("Account created! Redirecting to login...");
        setTimeout(() => onSignup(), 700);
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="login-container">

      <div className="login-card">
        <h2 className="login-header">Sign Up</h2>
        <p className="login-subtext">Create an account to continue</p>

        <form className="login-form">
          <div className="input-group">
            <label className="input-label">
              Username
              <input
                type="text"
                placeholder="Enter username"
                className="login-input"
                ref={usernameRef}
                required
              />
            </label>
          </div>

          <div className="input-group">
            <label className="input-label">
              Password
              <input
                type="password"
                placeholder="Enter password"
                className="login-input"
                ref={passwordRef}
                required
              />
            </label>
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            className="login-button"
          >
            Sign Up
          </button>
        </form>

        <div className="auth-toggle-text">
          Already have an account?{" "}
          <button className="auth-toggle-link" onClick={onLoginPage}>
            Log in
          </button>
        </div>
      </div>

      <div
        className={`status-banner-outside ${
          error ? "show" : ""
        } ${success ? "show success" : ""}`}
      >
        {(error || success) && (error || success)}
      </div>

    </div>
  );
}
