import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import "./Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Google OAuth callback
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;

    localStorage.setItem("token", token);

    axios
      .get("http://localhost:5000/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      })
      .then((res) => {
        localStorage.setItem("user", JSON.stringify(res.data));

        // ใช้ setTimeout เล็กน้อยเพื่อให้ Navbar อัปเดต
        setTimeout(() => {
          window.dispatchEvent(new Event("userLoggedIn"));
        }, 100);

        Swal.fire({ icon: "success", title: "Login success!" });
        navigate("/dashboard");
      })
      .catch(() => {
        Swal.fire({ icon: "error", title: "Login failed" });
      });
  }, [searchParams, navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/login", form, {
        withCredentials: true,
      });
      const { token } = res.data;
      localStorage.setItem("token", token);

      const userRes = await axios.get("http://localhost:5000/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      localStorage.setItem("user", JSON.stringify(userRes.data));
      window.dispatchEvent(new Event("userLoggedIn"));
      Swal.fire({ icon: "success", title: "Login success!" });
      navigate("/dashboard");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: err.response?.data?.message || "",
      });
    }
  };

  const googleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className="login-page-container">
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
            />
            Sign in with Google
          </button>

          <div className="register-links">
            Don't have an account? <a href="/register">Register</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
