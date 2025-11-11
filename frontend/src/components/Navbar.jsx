import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/logo.png";

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

function Navbar() {
  const [volume, setVolume] = useState(0.5);
  const [showSlider, setShowSlider] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // ✅ โหลดข้อมูลผู้ใช้จาก localStorage หรือ session (Google)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      fetch("http://localhost:5000/auth/user", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data._id) {
            localStorage.setItem("user", JSON.stringify(data));
            setUser(data);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleVolumeChange = (value) => {
    const newVolume = parseFloat(value);
    setVolume(newVolume);
    document.querySelectorAll("audio, video").forEach((el) => {
      el.volume = newVolume;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("🚪 ออกจากระบบเรียบร้อย");
    setUser(null);
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/">
          <img src={logo} alt="Sound Share Logo" className="logo" />
        </Link>
      </div>

      <div className="header-right">
        {/* 🔊 ปุ่มปรับเสียง */}
        <div className="volume-container">
          <button
            className="icon-button"
            onClick={() => setShowSlider(!showSlider)}
            title="ปรับระดับเสียงทั้งหมดในเว็บ"
          >
            🔊
          </button>

          <Link to="/upload" className="nav-link">
            Upload
          </Link>

          {showSlider && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(e.target.value)}
              className="volume-slider"
              orient="vertical"
            />
          )}
        </div>
        <Link to="/premium" className="nav-link">
          Premium
        </Link>
        <Link to="/about" className="nav-link">
          notifications
        </Link>

        {user ? (
          <>
            <Link to="/profile" className="profile-link">
              <img
                src={user.picture || defaultAvatar}
                alt="Profile"
                className="avatar"
              />
            </Link>
            <button onClick={handleLogout} className="gradient-login-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register" className="nav-link">
              Register
            </Link>
            <Link to="/login" className="gradient-login-button">
              Login
            </Link>
          </>
        )}

        {/* เมนูทางขวา */}
        <a href="/premium" className="nav-link">
          Premium
        </a>
        <a href="/about" className="nav-link">
          Notification
        </a>
        <a href="/profile" className="nav-link">
          Profile
        </a>
        <a href="/register" className="nav-link">
          Sing-in
        </a>
        <button class="gradient-login-button">Log-In</button>
      </div>
    </header>
  );
}

export default Navbar;
