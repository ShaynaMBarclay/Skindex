import React from "react";


export default function Landing({ onLoginClick, onSignupClick }) {
  return (
    <div className="landing-container">
      <h1 className="landing-title">Welcome to The Skindex Analyzer</h1>
      <p className="landing-subtitle">
        Your personal skincare companion 🧴
      </p>
      <div className="landing-buttons">
        <button className="landing-button" onClick={onSignupClick}>Sign Up</button>
        <button className="landing-button" onClick={onLoginClick}>Log In</button>
      </div>
    </div>
  );
}
