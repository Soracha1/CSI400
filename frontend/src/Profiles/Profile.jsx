import React, { useState } from "react";
import "./Profile.css";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si"; 

function Profile() {
  const [activeTab, setActiveTab] = useState("uploads"); // state สำหรับแท็บที่เลือก

  return (
    <div className="profile-container">
      {/* ส่วนหัวโปรไฟล์ */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            <img
              src="https://i.pinimg.com/736x/22/44/2a/22442af0fdfb0e09a62c3d08046232e7.jpg"
              alt="avatar"
            />
            <div className="edit-icon">✏️</div>
          </div>
          <h2 className="profile-name">Name</h2>
          <p className="profile-username">Bio Noname</p>

          <div className="profile-social">
            <a href="#"><FaFacebook /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><SiTiktok /></a>
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

      {/* เนื้อหาที่เปลี่ยนตามแท็บ */}
      <div className="profile-content">
        {activeTab === "uploads" && <p> แสดงรายการอัปโหลดทั้งหมด</p>}
        {activeTab === "downloads" && <p> แสดงไฟล์ที่คุณดาวน์โหลด</p>}
        {activeTab === "favorites" && <p> แสดงสิ่งที่คุณชื่นชอบ</p>}
      </div>
    </div>
  );
}

export default Profile;
