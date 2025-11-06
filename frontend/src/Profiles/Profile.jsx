import React, { useState } from "react";
import "./Profile.css";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

import ProfileUpload from "./ProfileUpload/Profileuploads";
import ProfileDownload from "./ProfileDownload/Profiledownload";
import ProfileFavorites from "./ProfileFovorites/Profilefovorites";


function Profile() {
  const [activeTab, setActiveTab] = useState("uploads");

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
          <h2 className="profile-name">Name</h2>
          <p className="profile-username">Bio Noname</p>

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
          5 UPLOADS
        </div>
        <div
          className={`tab ${activeTab === "downloads" ? "active" : ""}`}
          onClick={() => setActiveTab("downloads")}
        >
          5 DOWNLOADS
        </div>
        <div
          className={`tab ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          2999 FAVORITES
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
