import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Navbar.css";
import logo from "../assets/logo.png";
import { FaBell, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { io } from "socket.io-client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

function Navbar() {
  const [volume, setVolume] = useState(0.5);
  const [showSlider, setShowSlider] = useState(false);
  const [user, setUser] = useState(null);
  const [limits, setLimits] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

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

  // โหลด Notification ใหม่จาก API
  const loadNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notifications");
      const data = await res.json();
      // เพิ่ม unread flag
      const notifWithUnread = data.map((n) => ({ ...n, unread: true }));
      setNotifications(notifWithUnread);
      setUnreadCount(notifWithUnread.filter((n) => n.unread).length);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    // โหลด user info
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      fetchLimits(parsed._id);
      loadNotifications();

      // Socket.IO
      socketRef.current = io("http://localhost:5000");
      socketRef.current.on("notification", (notif) => {
        const newNotif = { ...notif, unread: true };
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    }

    const handleLoginEvent = () => {
      const saved = localStorage.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        fetchLimits(parsed._id);
        loadNotifications();
      }
    };

    window.addEventListener("userLoggedIn", handleLoginEvent);

    return () => {
      window.removeEventListener("userLoggedIn", handleLoginEvent);
      if (socketRef.current) socketRef.current.disconnect();
    };
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

    Swal.fire({
      icon: "success",
      title: "ออกจากระบบเรียบร้อย",
      text: "🚪 คุณได้ออกจากระบบแล้ว",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });

    setUser(null);
    setLimits(null);
    navigate("/");
    window.dispatchEvent(new Event("userLoggedOut"));
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
    }
  };

  const renderNotificationMessage = (n) => {
    let icon = null;
    let text = n.message || "";

    if (n.type === "upload" && n.user && n.song) {
      icon = <FaArrowUp style={{ color: "#4edfff" }} />;
      text = `${n.user.username} uploaded "${n.song.title}"`;
    } else if (n.type === "download" && n.user && n.song) {
      icon = <FaArrowDown style={{ color: "#ff8c42" }} />;
      text = `${n.user.username} downloaded "${n.song.title}"`;
    }

    const time = dayjs(n.createdAt).fromNow();

    return (
      <div className="notification-content">
        {icon}
        <span>{text}</span>
        <small className="notification-time">{time}</small>
      </div>
    );
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/">
          <img src={logo} alt="Sound Share Logo" className="logo" />
        </Link>
      </div>

      <div className="header-right">
        {/* ปุ่มปรับเสียง */}
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

        {/* ข้อมูล Upload/Download */}
        {limits && user && (
          <div className="usage-info">
            Uploads: {limits.uploadCount}/{limits.maxUpload} | Downloads:{" "}
            {limits.downloadCount}/{limits.maxDownload}
          </div>
        )}

        {user && (
          <Link to="/upload" className="nav-link">
            Upload
          </Link>
        )}

        <Link to="/premium" className="nav-link">
          Premium
        </Link>

        {/* กระดิ่ง Notification */}
        {user && (
          <div className="notification-wrapper" ref={dropdownRef}>
            <button
              className="icon-button"
              onClick={toggleDropdown}
              title="ดูการแจ้งเตือน"
            >
              <FaBell size={18} />
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>

            {showDropdown && (
              <div className="notification-dropdown">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n._id || Math.random()}
                      className={`notification-item ${n.unread ? "unread" : ""}`}
                    >
                      {renderNotificationMessage(n)}
                    </div>
                  ))
                ) : (
                  <div className="notification-empty">No notifications</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* โปรไฟล์ */}
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
      </div>
    </header>
  );
}

export default Navbar;
