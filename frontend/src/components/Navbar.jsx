import React, { useState } from "react";
import "./Navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const [volume, setVolume] = useState(0.5);
  const [showSlider, setShowSlider] = useState(false);

  const handleVolumeChange = (value) => {
    const newVolume = parseFloat(value);
    setVolume(newVolume);

    // ✅ ปรับเสียงของทุก <audio> และ <video> ในเว็บ
    const mediaElements = document.querySelectorAll("audio, video");
    mediaElements.forEach((el) => {
      el.volume = newVolume;
    });
  };

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

        {/* เมนูทางขวา */}
        <a href="/premium" className="nav-link">Premium</a>
        <a href="/about" className="nav-link">เกี่ยวกับ</a>
        <a href="/profile" className="nav-link">Profile</a>
        <a href="/register" className="nav-link">ลงทะเบียน</a>
        <a href="/login" className="login-button">เข้าสู่ระบบ</a>
      </div>
    </header>
  );
}

export default Navbar;
