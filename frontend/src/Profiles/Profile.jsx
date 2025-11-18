import React, { useState, useEffect } from "react";
import "./Profile.css";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

import ProfileUpload from "./ProfileUpload/Profileuploads";
import ProfileDownload from "./ProfileDownload/Profiledownload";
import ProfileFavorites from "./ProfileFovorites/Profilefovorites";
import EditProfile from "../EditProfile/EditProfile";

function Profile() {
  const [activeTab, setActiveTab] = useState("uploads");
  const [showEditModal, setShowEditModal] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadCount, setUploadCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const fetchUserData = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;
      const userId = userData?._id;
      const token = localStorage.getItem("token");

      if (!userId) return;

      setUser(userData);

      const uploadsRes = await fetch(`http://localhost:5000/api/user/${userId}/uploads`);
      const uploadsData = await uploadsRes.json();
      setUploadCount(uploadsData.length);

      try {
        const downloadsRes = await fetch(`http://localhost:5000/api/user/${userId}/downloads`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const downloadsData = await downloadsRes.json();
        setDownloadCount(downloadsData.length);
      } catch (err) {
        console.log("Downloads API not available");
      }

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

    const handleUploadSuccess = () => {
      console.log("Upload detected, refreshing counts...");
      fetchUserData();
    };

    const handleFavoriteChanged = () => {
      console.log("Favorite changed, refreshing counts...");
      fetchUserData();
    };

    const handleProfileUpdated = (event) => {
      console.log("Profile updated event received:", event.detail);
      const updatedUser = event.detail;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    window.addEventListener("uploadSuccess", handleUploadSuccess);
    window.addEventListener("favoriteChanged", handleFavoriteChanged);
    window.addEventListener("profileUpdated", handleProfileUpdated);

    return () => {
      window.removeEventListener("uploadSuccess", handleUploadSuccess);
      window.removeEventListener("favoriteChanged", handleFavoriteChanged);
      window.removeEventListener("profileUpdated", handleProfileUpdated);
    };
  }, []);

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

  const handleUpdateProfile = (updatedUser) => {
    if (updatedUser) {
      setUser(updatedUser);
    } else {
      fetchUserData();
    }
    setShowEditModal(false);
  };

  const handleEditClick = () => {
    console.log("Edit clicked!");
    setShowEditModal(true);
  };

  const avatarUrl = user?.avatar || user?.picture || "/src/assets/f.webp";

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            <img src={avatarUrl} alt="Profile" />
            <div 
              className="edit-icon" 
              onClick={handleEditClick}
              style={{ cursor: "pointer" }}
            >
              ✏️
            </div>
          </div>
          <h2 className="profile-name">{user?.username || "Name"}</h2>
          <p className="profile-username">{user?.email || "Bio Noname"}</p>
          {user?.bio && <p className="profile-bio">{user.bio}</p>}

          {/* ✅ อัปเดตให้แสดงลิงก์จริง หรือซ่อนถ้าไม่มี */}
          <div className="profile-social">
            {user?.facebook && (
              <a 
                href={user.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                title="Facebook"
              >
                <FaFacebook />
              </a>
            )}
            {user?.instagram && (
              <a 
                href={user.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                title="Instagram"
              >
                <FaInstagram />
              </a>
            )}
            {user?.tiktok && (
              <a 
                href={user.tiktok} 
                target="_blank" 
                rel="noopener noreferrer"
                title="TikTok"
              >
                <SiTiktok />
              </a>
            )}
            
            {/* ✅ ถ้าไม่มี social media เลย แสดงข้อความ */}
            {!user?.facebook && !user?.instagram && !user?.tiktok && (
              <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
                ยังไม่ได้เพิ่ม Social Media
              </p>
            )}
          </div>
        </div>
      </div>

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

      <div className="profile-content">
        {renderTabContent()}
      </div>

      {showEditModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowEditModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <EditProfile
              onClose={() => setShowEditModal(false)}
              onUpdate={handleUpdateProfile}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;