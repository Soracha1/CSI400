import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import logo from "../assets/logo.png";
import { FaBell } from "react-icons/fa";

function Navbar() {
  const [volume, setVolume] = useState(0.5);
  const [showSlider, setShowSlider] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleVolumeChange = (value) => {
    const newVolume = parseFloat(value);
    setVolume(newVolume);

    // ✅ ปรับเสียงของทุก <audio> และ <video> ในเว็บ
    const mediaElements = document.querySelectorAll("audio, video");
    mediaElements.forEach((el) => {
      el.volume = newVolume;
    });
  };

  // 📌 ปิด dropdown เมื่อคลิกนอกกล่อง
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ตัวอย่างแจ้งเตือนจำลอง
  const notifications = [
    { id: 1, text: "🎧 New track: Lo-fi Chill Mix" },
    { id: 2, text: "🔥 Your favorite sample hit 1k downloads!" },
    { id: 3, text: "💬 Someone commented on your post" },
  ];

  return (
    <header className="header">
      <div className="header-left">
        <a href="/">
          <img src={logo} alt="Sound Share Logo" className="logo" />
        </a>
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

         {showSlider && (
    <div className="volume-dropdown">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => handleVolumeChange(e.target.value)}
        className="volume-slider"
      />
    </div>
  )}
        </div>

        {/* 🌟 เมนูทางขวา */}


        {/* 🔔 Notification Dropdown */}
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
        <a href="/premium" className="nav-link">
          Premium
        </a>

        <a href="/profile" className="nav-link">
          Profile
        </a>
        <a href="/register" className="nav-link">
          Sign-in
        </a>

        <button className="gradient-login-button">Log-In</button>
      </div>
    </header>
  );
}

export default Navbar;
