import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ รองรับ Google OAuth callback
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;

    localStorage.setItem("token", token);

    // ✅ โหลด user จาก token ที่ส่งมาจาก Google
    axios
      .get("http://localhost:5000/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      })
      .then((res) => {
        localStorage.setItem("user", JSON.stringify(res.data));
        alert("✅ Google login success!");
        window.dispatchEvent(new Event("userLoggedIn")); // แจ้ง Navbar
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error(err);
        alert("⚠️ Failed to fetch user info from Google login");
      });
  }, [searchParams, navigate]);

  // ✅ handle input
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ login ด้วย email/password
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/login", form, {
        withCredentials: true,
      });

      const { token } = res.data;
      localStorage.setItem("token", token);

      // ✅ โหลดข้อมูลผู้ใช้จาก token ทันที
      const userRes = await axios.get("http://localhost:5000/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      localStorage.setItem("user", JSON.stringify(userRes.data));

      alert("✅ Login success!");
      window.dispatchEvent(new Event("userLoggedIn")); // แจ้ง Navbar
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  // ✅ ปุ่ม Google Login
  const googleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Log in to your account</h2>

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-password"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button type="submit" className="login-button">
          Log in
        </button>

        <button type="button" className="google-btn" onClick={googleLogin}>
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
