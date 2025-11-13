import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/logo.png";
import { FaBell } from "react-icons/fa";

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

function Navbar() {
  const [volume, setVolume] = useState(0.5);
  const [showSlider, setShowSlider] = useState(false);
  const [user, setUser] = useState(null);
  const [limits, setLimits] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // โหลด limits ของ user
  const fetchLimits = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/${id}/limits`);
      const data = await res.json();
      setLimits(data);
    } catch (err) {
      console.error("Error fetching limits:", err);
    }
  };

  // โหลด user + limits ตอน mount
  useEffect(() => {
    const loadUser = async () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        await fetchLimits(parsed._id);
      } else {
        setUser(null);
        setLimits(null);
      }
    };
    loadUser();
    window.addEventListener("userLoggedIn", loadUser);
    return () => window.removeEventListener("userLoggedIn", loadUser);
  }, []);

  const handleVolumeChange = (value) => {
    const newVolume = parseFloat(value);
    setVolume(newVolume);
    document
      .querySelectorAll("audio, video")
      .forEach((el) => (el.volume = newVolume));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("🚪 ออกจากระบบเรียบร้อย");
    setUser(null);
    setLimits(null);
    navigate("/");
    window.dispatchEvent(new Event("userLoggedOut"));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, text: "🎧 New track: Lo-fi Chill Mix" },
    { id: 2, text: "🔥 Your favorite sample hit 1k downloads!" },
    { id: 3, text: "💬 Someone commented on your post" },
  ];

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/">
          <img src={logo} alt="Sound Share Logo" className="logo" />
        </Link>
      </div>
      <div className="header-right">
        <div className="volume-container">
          <button
            className="icon-button"
            onClick={() => setShowSlider(!showSlider)}
            title="ปรับระดับเสียงทั้งหมดในเว็บ"
          >
            🔊
          </button>
          {showSlider && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(e.target.value)}
              className="volume-slider"
            />
          )}
        </div>
        <Link to="/upload" className="nav-link">
          Upload
        </Link>
        <Link to="/premium" className="nav-link">
          Premium
        </Link>
        {limits && (
          <div className="usage-info">
            Uploads: {limits.uploadCount}/{limits.maxUpload} | Downloads:{" "}
            {limits.downloadCount}/{limits.maxDownload}
          </div>
        )}
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

        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            className="icon-button"
            onClick={() => setShowDropdown(!showDropdown)}
            title="ดูการแจ้งเตือน"
          >
            <FaBell size={18} />
          </button>
          {showDropdown && (
            <div className="notification-dropdown">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className="notification-item">
                    {n.text}
                  </div>
                ))
              ) : (
                <div className="notification-empty">No notifications</div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
