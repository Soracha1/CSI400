import React from "react";
import "./help.css";

export default function HelpSupport() {
  return (
    <section className="help-container" aria-labelledby="help-heading">
      <div className="help-card">
        <header className="help-header">
          <h1 id="help-heading">Help &amp; Support</h1>
          <p className="help-sub">If you need help, please check the guide below first 🎵</p>
        </header>

        <ol className="help-list">
          <li>
            <strong>First-time registration:</strong>
            <p>Click “Sign Up” and fill in all required information</p>
          </li>
          <li>
            <strong>Login:</strong>
            <p>Click “Login” to access your account</p>
          </li>
          <li>
            <strong>Upload sounds:</strong>
            <p>Go to the “Upload” page and choose your audio file along with the details</p>
          </li>
          <li>
            <strong>Download sounds:</strong>
            <p>Go to the “Browse Sounds” page and click “Download” under a file</p>
          </li>
          <li>
            <strong>Contact support:</strong>
            <p>Reach out to the support team for further assistance</p>
          </li>
          <li>
            <strong>Usage rights:</strong>
            <p>Make sure to review the usage rights before any commercial use</p>
          </li>
        </ol>

        <footer className="help-footer">
          We hope this guide helps you use the app more easily!
        </footer>
      </div>
    </section>
  );
}
