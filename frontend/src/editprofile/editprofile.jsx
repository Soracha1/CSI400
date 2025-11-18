import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./editprofile.css";

function EditProfile({ onClose, onUpdate }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // ✅ เพิ่ม state สำหรับ social media
  const [tiktok, setTiktok] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (user) {
      setDisplayName(user.username || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
      
      // ✅ โหลดข้อมูล social media
      setTiktok(user.tiktok || "");
      setInstagram(user.instagram || "");
      setFacebook(user.facebook || "");
      
      const currentAvatar = user.avatar || user.picture;
      if (currentAvatar) {
        setAvatarPreview(currentAvatar);
      } else {
        setAvatarPreview("http://localhost:5000/uploads/logo.png");
      }
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "ไฟล์ใหญ่เกินไป",
          text: "กรุณาเลือกรูปที่มีขนาดไม่เกิน 5MB",
        });
        return;
      }

      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!displayName.trim()) {
      Swal.fire({
        icon: "error",
        title: "กรุณากรอกชื่อ",
        text: "Display Name ห้ามเว้นว่าง",
      });
      return;
    }

    if (!token) {
      Swal.fire({
        icon: "error",
        title: "ไม่พบ Token",
        text: "กรุณา Login ใหม่",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", displayName);
      formData.append("email", email);
      formData.append("bio", bio);
      
      // ✅ เพิ่ม social media ลงใน formData
      formData.append("tiktok", tiktok);
      formData.append("instagram", instagram);
      formData.append("facebook", facebook);
      
      if (avatar) {
        formData.append("avatar", avatar);
      }

      const res = await axios.put(
        `http://localhost:5000/api/user/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = { 
        ...user, 
        ...res.data.user,
        avatar: res.data.user.avatar || res.data.user.picture,
        picture: res.data.user.avatar || res.data.user.picture
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));

      window.dispatchEvent(new CustomEvent("profileUpdated", { 
        detail: updatedUser 
      }));

      Swal.fire({
        icon: "success",
        title: "อัพเดทโปรไฟล์สำเร็จ! 🎉",
        text: "ข้อมูลของคุณถูกบันทึกแล้ว",
        timer: 2000,
        showConfirmButton: false,
      });

      if (onUpdate) {
        onUpdate(updatedUser);
      }
      
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);

    } catch (err) {
      console.error("❌ Update profile error:", err);
      
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.response?.data?.message || err.message || "ไม่สามารถอัพเดทโปรไฟล์ได้",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-container">
      <div className="edit-header">
        <h2 className="edit-title">แก้ไขโปรไฟล์</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <form className="edit-form" onSubmit={handleSave}>
        <div className="edit-left">
          <div className="avatar-box">
            <img
              src={avatarPreview || "http://localhost:5000/uploads/logo.png"}
              alt="Avatar"
              onError={(e) => {
                e.target.src = "http://localhost:5000/uploads/logo.png";
              }}
            />
          </div>
          <label className="avatar-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={loading}
            />
            <span>📷 เปลี่ยนรูปโปรไฟล์</span>
          </label>
        </div>

        <div className="edit-right">
          <div className="form-group">
            <label>ชื่อที่แสดง *</label>
            <input
              type="text"
              placeholder="กรอกชื่อของคุณ"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>อีเมล *</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              placeholder="เขียนอะไรสักหน่อยเกี่ยวกับตัวคุณ..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loading}
              rows="4"
            />
          </div>

          {/* ✅ เพิ่มส่วน Social Media */}
          <div className="social-section">
            <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>
              🌐 Social Media
            </h3>
            
            <div className="form-group">
              <label>TikTok</label>
              <input
                type="url"
                placeholder="https://www.tiktok.com/@yourusername"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Instagram</label>
              <input
                type="url"
                placeholder="https://www.instagram.com/yourusername"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Facebook</label>
              <input
                type="url"
                placeholder="https://www.facebook.com/yourusername"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            className="save-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;