import React, { useState } from "react";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: ส่งอีเมลไป backend เพื่อรีเซ็ตรหัสผ่าน
    alert(`ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปที่: ${email}`);
  };

  return (
    <div className="forgot-container">
      <div className="forgot-form">
        <h2 className="forgot-header">Forgot Password</h2>
        <p className="forgot-description">
          ป้อนอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label><br />
          <input
            type="email"
            id="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          /><br />
          <button type="submit" className="reset-button">Send Reset Link</button>
        </form>

        <div className="back-to-login">
          <a href="/login">← Back to Login</a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
