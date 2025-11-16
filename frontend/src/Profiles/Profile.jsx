import React, { useState, useEffect } from "react";
import "./Profile.css";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

import ProfileUpload from "./ProfileUpload/Profileuploads";
import ProfileDownload from "./ProfileDownload/Profiledownload";
import ProfileFavorites from "./ProfileFovorites/Profilefovorites";

function Profile() {
  const [activeTab, setActiveTab] = useState("uploads");
  const [user, setUser] = useState(null);
  const [uploadCount, setUploadCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  // ✅ Fetch user data และ counts
  const fetchUserData = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;
      const userId = userData?._id;
      const token = localStorage.getItem("token");

      if (!userId) return;

      setUser(userData);

      // Fetch uploads count
      const uploadsRes = await fetch(`http://localhost:5000/api/user/${userId}/uploads`);
      const uploadsData = await uploadsRes.json();
      setUploadCount(uploadsData.length);

      // Fetch downloads count
      try {
        const downloadsRes = await fetch(`http://localhost:5000/api/user/${userId}/downloads`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const downloadsData = await downloadsRes.json();
        setDownloadCount(downloadsData.length);
      } catch (err) {
        console.log("Downloads API not available");
      }

      // ✅ Fetch favorites count
      try {
        const favoritesRes = await fetch(`http://localhost:5000/api/user/${userId}/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const favoritesData = await favoritesRes.json();
        setFavoriteCount(favoritesData.length);
      } catch (err) {
        console.log("Favorites API not available");
      }

    } catch (err) {
      console.error("Error fetching counts:", err);
    }
  };

  useEffect(() => {
    fetchUserData();

    // ✅ Listen for upload success event
    const handleUploadSuccess = () => {
      console.log("Upload detected, refreshing counts...");
      fetchUserData();
    };

    // ✅ Listen for favorite changed event
    const handleFavoriteChanged = () => {
      console.log("Favorite changed, refreshing counts...");
      fetchUserData();
    };

    window.addEventListener("uploadSuccess", handleUploadSuccess);
    window.addEventListener("favoriteChanged", handleFavoriteChanged);

    return () => {
      window.removeEventListener("uploadSuccess", handleUploadSuccess);
      window.removeEventListener("favoriteChanged", handleFavoriteChanged);
    };
  }, []);

  // ✅ ฟังก์ชันเลือกหน้าให้แสดงตามแท็บ
  const renderTabContent = () => {
    switch (activeTab) {
      case "uploads":
        return <ProfileUpload />;
      case "downloads":
        return <ProfileDownload />;
      case "favorites":
        return <ProfileFavorites />;
      default:
        return null;
    }
  };

  return (
    <div className="profile-container">
      {/* ส่วนหัวโปรไฟล์ */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            <img src="/src/assets/logo.png" alt="Profile" />
            <div className="edit-icon">✏️</div>
          </div>
          <h2 className="profile-name">{user?.username || "Name"}</h2>
          <p className="profile-username">{user?.email || "Bio Noname"}</p>

          <div className="profile-social">
            <a href="#"><FaFacebook /></a>
            <a href="#"><FaInstagram /></a>
            <a href="https://www.tiktok.com/"><SiTiktok /></a>
          </div>
        </div>
      </div>

      {/* แถบแท็บ */}
      <div className="profile-tabs">
        <div
          className={`tab ${activeTab === "uploads" ? "active" : ""}`}
          onClick={() => setActiveTab("uploads")}
        >
          UPLOADS {uploadCount > 0 && `(${uploadCount})`}
        </div>
        <div
          className={`tab ${activeTab === "downloads" ? "active" : ""}`}
          onClick={() => setActiveTab("downloads")}
        >
          DOWNLOADS {downloadCount > 0 && `(${downloadCount})`}
        </div>
        <div
          className={`tab ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          FAVORITES {favoriteCount > 0 && `(${favoriteCount})`}
        </div>
      </div>

      {/* เนื้อหาของแต่ละแท็บ */}
      <div className="profile-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default Profile;