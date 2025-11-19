// Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { io } from "socket.io-client";
import "./Navbar.css";
import logo from "../assets/logo.png";
import { FaBell } from "react-icons/fa";

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const [limits, setLimits] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showSlider, setShowSlider] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // NEW: Admin menu dropdown
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const socketRef = useRef(null);
  const userIdRef = useRef(null);
  const backgroundAudioRef = useRef(null);
  const navigate = useNavigate();

  // ================== Fetch limits ==================
  const fetchLimits = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/${id}/limits`);
      const data = await res.json();
      setLimits(data);
    } catch (err) {
      console.error("Error fetching limits:", err);
    }
  };

  // ================== Load notifications ==================
  const loadNotifications = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/notifications?userId=${userId}`
      );
      const data = await res.json();
      const notifWithUnread = data.map((n) => ({ ...n, unread: true }));
      setNotifications(notifWithUnread);
      setUnreadCount(notifWithUnread.length);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  // ================== First load user ==================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      userIdRef.current = parsed._id;
      fetchLimits(parsed._id);
      loadNotifications(parsed._id);
    }
  }, []);

  // ================== Volume slider ==================
  useEffect(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = volume;
    }
    window.dispatchEvent(new CustomEvent("volumeChanged", { detail: volume }));
  }, [volume]);

  // ================== Socket.IO ==================
  useEffect(() => {
    if (!userIdRef.current) return;

    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("notification", (notif) => {
      if (notif.userId === userIdRef.current) {
        const newNotif = { ...notif, unread: true };
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // ================== Listen for login/logout/profile updates ==================
  useEffect(() => {
    const updateUser = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        userIdRef.current = parsed._id;
        fetchLimits(parsed._id);
        loadNotifications(parsed._id);
      } else {
        setUser(null);
        setLimits(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    window.addEventListener("userLoggedIn", updateUser);
    window.addEventListener("userLoggedOut", updateUser);
    window.addEventListener("profileUpdated", (e) => setUser(e.detail));

    return () => {
      window.removeEventListener("userLoggedIn", updateUser);
      window.removeEventListener("userLoggedOut", updateUser);
      window.removeEventListener("profileUpdated", (e) => setUser(e.detail));
    };
  }, []);

  // ================== Logout ==================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    Swal.fire({
      icon: "success",
      title: "ออกจากระบบแล้ว",
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });

    window.dispatchEvent(new Event("userLoggedOut"));
    navigate("/");
  };

  // ================== Notifications ==================
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);

    if (!showNotifications) {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
    }
  };

  const avatarUrl = user?.avatar || user?.picture || defaultAvatar;

  return (
    <header className="header">
      {/* Background audio */}
      <audio
        ref={backgroundAudioRef}
        src="/background.mp3"
        autoPlay
        loop
        style={{ display: "none" }}
      />

      <div className="header-left">
        <Link to="/">
          <img src={logo} alt="Logo" className="logo" />
        </Link>
      </div>

      <div className="header-right">
        {/* Volume control */}
        <div className="volume-container">
          <button
            className="icon-button"
            onClick={() => setShowSlider(!showSlider)}
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
              onChange={(e) => setVolume(Number(e.target.value))}
              className="volume-slider"
            />
          )}
        </div>

        {/* Upload/Download Limits */}
        {user && limits && (
          <div className="usage-info">
            Upload: {limits.uploadCount}/{limits.maxUpload} | Download:{" "}
            {limits.downloadCount}/{limits.maxDownload}
          </div>
        )}

        {/* Upload */}
        {user && (
          <Link to="/upload" className="nav-link">
            Upload
          </Link>
        )}

        {/* ================== Admin Dropdown ================== */}
        {user?.role === "admin" && (
          <div className="admin-dropdown">
            <button
              className="nav-link admin-link dropdown-toggle"
              onClick={() => setShowAdminMenu(!showAdminMenu)}
            >
              Admin
            </button>

            {showAdminMenu && (
              <div className="dropdown-menu">
                <Link to="/admin" className="dropdown-item">
                  Admin Panel
                </Link>
                <Link to="/admin/songs" className="dropdown-item">
                  Songs Management
                </Link>
                <Link to="/admin/analytics" className="dropdown-item">
                  Analytics
                </Link>
                <Link to="/admin/generate-codes" className="dropdown-item">
                  Generate Code
                </Link>
              </div>
            )}
          </div>
        )}

        {/* User pages */}
        <Link to="/premium" className="nav-link">
          Premium
        </Link>
        <Link to="/analytics" className="nav-link">
          Your Analytics
        </Link>

        {/* Notification */}
        {user && (
          <div className="notification-wrapper">
            <button className="icon-button" onClick={toggleNotifications}>
              <FaBell size={18} />
              {unreadCount > 0 && (
                <span className="notification-dot">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                {notifications.length === 0 && <p>No notifications</p>}
                {notifications.map((n, idx) => (
                  <div
                    key={idx}
                    className={`notification-item ${
                      n.unread ? "unread" : ""
                    }`}
                  >
                    {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile */}
        {user ? (
          <>
            <Link to="/profile" className="profile-link">
              <img src={avatarUrl} className="avatar" />
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
