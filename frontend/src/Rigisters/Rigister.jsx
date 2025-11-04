import React, { useState } from "react";
import "./Rigister.css";

function Rigister() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="i-container">
      <div className="i-form">
        <div className="i-header">Create an account</div>

        <label htmlFor="username">Username</label><br />
        <input type="text" id="username" name="username" required />
        <br />

        <label htmlFor="password">Password</label><br />
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            required
            
          />
         
        </div>
        <br />

        <div className="i-create">
          <button type="submit">Create account</button>
        </div>

        <div className="i-google">
          <button type="button">
            <img
              src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
              alt="google logo"
              width={14}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            Sign up with Google
          </button>
        </div>

        <div className="i-login-text">
          Already have an account?{" "}
          <a href="/Login" className="i-Login">
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}

export default Rigister;


