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
  // const res = await fetch(`http://localhost:5000/api/notifications?userId=${user._id}`);

  const socketRef = useRef(null);
  const navigate = useNavigate();

  // ================== Fetch limits ==================
  const fetchLimits = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/${id}/limits`);
      const data = await res.json();
      console.log("Fetched limits:", data);
      setLimits(data);
    } catch (err) {
      console.error("Error fetching limits:", err);
    }
  };

  // ================== Load notifications ==================
const loadNotifications = async (userId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/notifications?userId=${userId}`);
    const data = await res.json();
    const notifWithUnread = data.map((n) => ({ ...n, unread: true }));
    setNotifications(notifWithUnread);
    setUnreadCount(notifWithUnread.filter((n) => n.unread).length);
  } catch (err) {
    console.error("Error loading notifications:", err);
  }
};

//
useEffect(() => {
  const handleNewNotification = (event) => {
    const notif = event.detail;
    // ใช้ userIdRef.current แทน user._id
    if (userIdRef.current && notif.userId === userIdRef.current) {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }
  };

  window.addEventListener("newNotification", handleNewNotification);

  return () => {
    window.removeEventListener("newNotification", handleNewNotification);
  };
}, []); // dependency เป็น [] เพื่อไม่ลบ listener ทุกครั้งที่ user เปลี่ยน

// =================== Get user from localStorage on mount ==================
const userIdRef = useRef(null);

useEffect(() => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    const parsed = JSON.parse(savedUser);
    setUser(parsed);
    userIdRef.current = parsed._id; // เก็บ userId ใน ref
  }
}, []);

  // ================== Handle user ==================
  useEffect(() => {
    const updateUserFromLocalStorage = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchLimits(parsed._id);
        loadNotifications();

        // ================== Socket.IO connection ==================
        if (!socketRef.current) {
          socketRef.current = io("http://localhost:5000");

          socketRef.current.on("connect", () => {
            console.log("✅ Connected to Socket.IO server:", socketRef.current.id);
          });

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

    // Check token in URL
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

  // ================== Logout ==================
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

  // ================== Volume ==================
  const handleVolumeChange = (value) => setVolume(Number(value));

  const avatarUrl = user?.avatar || user?.picture || defaultAvatar;

  // ================== Toggle Notifications ==================
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Mark all notifications as read
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/">
          <img src={logo} alt="Logo" className="logo" />
        </Link>
      </div>

      <div className="header-right">
        {/* Volume */}
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

        {/* Upload / Download Info */}
        {limits && user && (
          <div className="usage-info">
            <span className="upload-info">
              Upload: {limits.uploadCount}/{limits.maxUpload}
            </span>{" "}
            |{" "}
            <span className="download-info">
              Download: {limits.downloadCount}/{limits.maxDownload}
            </span>
          </div>
        )}

        {/* Upload Link */}
        {user && (
          <Link to="/upload" className="nav-link">
            Upload
          </Link>
        )}

        {/* Admin Links */}
        {user && user.role === "admin" && (
          <>
            <Link to="/admin" className="nav-link admin-link">
              Admin Panel
            </Link>
            <Link to="/admin/songs" className="nav-link admin-link">
              Songs Management
            </Link>
            <Link to="/admin/analytics" className="nav-link admin-link">
              Analytics
            </Link>
          </>
        )}

        {/* Other Links */}
        <Link to="/premium" className="nav-link">
          Premium
        </Link>
        <Link to="/analytics" className="nav-link">
          Your Analytics
        </Link>

        {/* Notification */}
        {user && (
          <div className="notification-wrapper">
            <button
              className="icon-button"
              onClick={toggleNotifications}
              title="Notifications"
            >
              <FaBell size={18} />
              {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
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

        {/* Profile / Logout */}
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
