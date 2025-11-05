import React, { useState } from "react";
import axios from "axios";
import "./Rigister.css";

function Rigister() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/register", form);
      alert("✅ Register success!");
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.message || "Register failed");
    }
  };

  const googleSignup = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className="i-container">
      <form className="i-form" onSubmit={handleSubmit}>
        <div className="i-header">Create an account</div>

        <label>Username</label>
        <br />
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <br />

        <label>Email</label>
        <br />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <br />

        <label>Password</label>
        <br />
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <br />

        <button type="submit" className="create-btn">
          Create account
        </button>

        <button type="button" onClick={googleSignup} className="google-btn">
          <img
            src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
            alt="google"
            width={14}
            style={{ marginRight: 8 }}
          />
          Sign up with Google
        </button>

        <div className="i-login-text">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </form>
    </div>
  );
}

export default Rigister;