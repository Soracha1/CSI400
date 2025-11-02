import React, { useState } from "react";
import "./Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">Log in to your account</div>

        <label htmlFor="username">Username</label><br />
        <input type="text" id="username" name="username" required /><br />

        <div className="password-section">
          <div className="forgot-password-container">
            <a href="/forgotpassword" className="forgot-password">
              Forgot?
            </a>
          </div>

          <div className="password-field">
            <label htmlFor="password">Password</label><br />
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "ปิดรหัสผ่าน" : "ดูรหัสผ่าน"}
              </button>
            </div>
          </div>
        </div>

        <div className="login-actions">
          <button className="login-button">Log in</button>
        </div>

        <div className="register-links">
          <label>
            Don't have an account?{" "}
            <a href="/register" className="register-link">register</a>
          </label>
        </div>
      </div>
    </div>
  );
}

export default Login;




