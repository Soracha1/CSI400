import React, { useState } from "react";
import axios from "axios";

function UploadSong() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) return alert("กรุณาเลือกไฟล์เพลงก่อน!");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("music", file);

    try {
      await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("อัปโหลดเพลงสำเร็จ!");
      setTitle("");
      setArtist("");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("อัปโหลดไม่สำเร็จ");
    }
  };

  return (
    <div style={{ marginBottom: 30 }}>
      <h2>อัปโหลดเพลงใหม่</h2>
      <form onSubmit={handleUpload}>
        <input
          type="text"
          placeholder="ชื่อเพลง"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="ศิลปิน"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit">อัปโหลด</button>
      </form>
    </div>
  );
}

export default UploadSong;
