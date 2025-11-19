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

  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const socketRef = useRef(null);
  const navigate = useNavigate();

  const fetchLimits = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/${id}/limits`);
      const data = await res.json();
      setLimits(data);
    } catch (err) {
      console.error("Error fetching limits:", err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notifications");
      const data = await res.json();
      const notifWithUnread = data.map((n) => ({ ...n, unread: true }));
      setNotifications(notifWithUnread);
      setUnreadCount(notifWithUnread.filter((n) => n.unread).length);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    const updateUserFromLocalStorage = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchLimits(parsed._id);
        loadNotifications();

        if (!socketRef.current) {
          socketRef.current = io("http://localhost:5000");
          socketRef.current.on("notification", (notif) => {
            const newNotif = { ...notif, unread: true };
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          });
        }
      } else {
        setUser(null);
        setLimits(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    updateUserFromLocalStorage();

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      fetch("http://localhost:5000/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("user", JSON.stringify(data));
          window.dispatchEvent(new Event("userLoggedIn"));
          updateUserFromLocalStorage();
          navigate("/dashboard");
        });
    }

    const handleLoginEvent = () => updateUserFromLocalStorage();
    const handleProfileUpdated = (event) => setUser(event.detail);

    window.addEventListener("userLoggedIn", handleLoginEvent);
    window.addEventListener("userLoggedOut", handleLoginEvent);
    window.addEventListener("profileUpdated", handleProfileUpdated);

    return () => {
      window.removeEventListener("userLoggedIn", handleLoginEvent);
      window.removeEventListener("userLoggedOut", handleLoginEvent);
      window.removeEventListener("profileUpdated", handleProfileUpdated);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [navigate]);

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

    window.dispatchEvent(new Event("userLoggedOut"));
    navigate("/");
  };

  const handleVolumeChange = (value) => setVolume(Number(value));
  const avatarUrl = user?.avatar || user?.picture || defaultAvatar;

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/">
          <img src={logo} alt="Logo" className="logo" />
        </Link>
      </div>

      <div className="header-right">
        {/* Volume Control */}
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

        {/* Usage Info */}
        {limits && user && (
          <div className="usage-info">
            Uploads: {limits.uploadCount}/{limits.maxUpload} | Downloads:{" "}
            {limits.downloadCount}/{limits.maxDownload}
          </div>
        )}

        {/* Member Status & Plan Expiry */}
        {user && (
          <div className="member-info">
            Member: {user.plan || "Free"}
            {user.planExpire && (
              <> | Expire: {new Date(user.planExpire).toLocaleDateString()}</>
            )}
          </div>
        )}

        {/* Navigation Links */}
        {user && (
          <Link to="/upload" className="nav-link">
            Upload
          </Link>
        )}

        {/* Admin Dropdown */}
        {user && user.role === "admin" && (
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
                <Link to="/admin/code-history" className="dropdown-item">
                  Redeem Code History
                </Link>
              </div>
            )}
          </div>
        )}

        <Link to="/premium" className="nav-link">
          Premium
        </Link>
        <Link to="/analytics" className="nav-link">
          Your Analytics
        </Link>

        {/* Notifications */}
        {user && (
          <div className="notification-wrapper">
            <button
              className="icon-button"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FaBell size={18} />
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                {notifications.length === 0 && <p>No notifications</p>}
                {notifications.map((n, idx) => (
                  <div
                    key={idx}
                    className={`notification-item ${n.unread ? "unread" : ""}`}
                  >
                    {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile / Login-Logout */}
        {user ? (
          <>
            <Link to="/profile" className="profile-link">
              <img src={avatarUrl} alt="Profile" className="avatar" />
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
