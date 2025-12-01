import React, { useState, useRef } from "react";
import "../Authentication.css";

export default function SignupPage({ onSignup, onLoginPage }) {
  const usernameRef = useRef();
  const passwordRef = useRef();
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const username = usernameRef.current.value;
    const password = passwordRef.current.value;

    if (!username) {
      setError("Please enter a valid username.");
      return;
    }
    else if (!password) {
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
        onSignup();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError("An unexpected error occurred, Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className = "login-header">Login</h2>
        <p className="login-subtext">Sign up to continue</p>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <form className="login-form">
          <div className="input-group">
            <label className="input-label">
              Username
              <input 
                  type="text" 
                  required 
                  placeholder="Enter username" 
                  className="login-input"
                  ref={usernameRef} 
              />
            </label>
          </div>

          <div className="input-group">
            <label className="input-label">
              Password
              <input 
                  type="password" 
                  required 
                  placeholder="Enter password" 
                  className="login-input"
                  ref={passwordRef} 
              />
            </label>
          </div>

          <button type="submit" onClick={handleSubmit} className="login-button">
              Sign Up
          </button>
        </form>
        <div className="auth-toggle-text">
          Already have an account?{" "}
          <button className="auth-toggle-link" onClick={onLoginPage}>
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}