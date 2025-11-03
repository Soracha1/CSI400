import React, { useState } from "react";
import "./editprofile.css";

function EditProfile() {
  const [displayName, setDisplayName] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    // ทำการส่งข้อมูลไป server ได้
    console.log({ displayName, website, bio, avatar });
    alert("✅ Profile updated!");
  };

  return (
    <div className="edit-container">
      <h2 className="edit-title">Avatar</h2>

      <form className="edit-form" onSubmit={handleSave}>
        <div className="edit-left">
          <div className="avatar-box">
            <img
              src={
                avatarPreview ||
                "https://via.placeholder.com/150?text=Avatar"
              }
              alt="Avatar"
            />
          </div>
          <label className="avatar-upload">
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            <span> Upload Avatar</span>
          </label>
        </div>

        <div className="edit-right">
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Website</label>
            <input
              type="text"
              placeholder="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              placeholder="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button className="save-btn" type="submit">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;



