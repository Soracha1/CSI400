import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/login", form);
      localStorage.setItem("token", res.data.token);
      alert("✅ Login success!");
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  const googleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-header">Log in to your account</div>

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
        <br />

        <button type="submit" className="login-button">
          Log in
        </button>

        <button type="button" onClick={googleLogin} className="google-btn">
          <img
            src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
            alt="google"
            width={14}
            style={{ marginRight: 8 }}
          />
          Sign in with Google
        </button>

        <div className="register-links">
          Don't have an account? <a href="/register">Register</a>
        </div>
      </form>
    </div>
  );
}

export default Login;