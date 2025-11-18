import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Navbar.css";
import logo from "../assets/logo.png";
import { FaBell } from "react-icons/fa";

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const [limits, setLimits] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
      const saved = localStorage.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        fetchLimits(parsed._id);
        loadNotifications();
      } else {
        setUser(null);
        setLimits(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    // โหลดตอน mount
    updateUserFromLocalStorage();

    // ตรวจสอบ URL ว่ามี token จาก Google login
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

    // ฟัง event login/logout
    window.addEventListener("userLoggedIn", updateUserFromLocalStorage);
    window.addEventListener("userLoggedOut", updateUserFromLocalStorage);

    return () => {
      window.removeEventListener("userLoggedIn", updateUserFromLocalStorage);
      window.removeEventListener("userLoggedOut", updateUserFromLocalStorage);
    };
  }, []);

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

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/">
          <img src={logo} alt="Logo" className="logo" />
        </Link>
      </div>

      <div className="header-right">
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

        <Link to="/premium" className="nav-link">
          Premium
        </Link>
        <Link to="analytics" className="nav-link">
          Your Analytics
        </Link>

        {user && (
          <div className="notification-wrapper">
            <button className="icon-button">
              <FaBell size={18} />
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>
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
      </div>
    </header>
  );
}

export default Navbar;
