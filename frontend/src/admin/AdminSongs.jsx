import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminSongs.css";

function AdminSongs() {
  const [songs, setSongs] = useState([]);
  const [editingSong, setEditingSong] = useState(null);
  const token = localStorage.getItem("token");

  // fetch เพลงทั้งหมด
  const fetchSongs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/songs");
      setSongs(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "โหลดเพลงไม่สำเร็จ", "error");
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  // ลบเพลง
  const handleDelete = async (id) => {
    const confirmed = await Swal.fire({
      title: "คุณแน่ใจไหม?",
      text: "คุณจะไม่สามารถกู้เพลงนี้กลับมาได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่ ลบเลย!",
    });

    if (confirmed.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/songs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Deleted!", "เพลงถูกลบเรียบร้อย", "success");
        fetchSongs();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "ลบเพลงไม่สำเร็จ", "error");
      }
    }
  };

  // เปิด modal แก้ไข
  const openEditModal = (song) => setEditingSong({ ...song });

  // บันทึกแก้ไขเพลง
  const handleEditSave = async () => {
    try {
      const formData = new FormData();

      for (const key in editingSong) {
        if (editingSong[key] !== null && editingSong[key] !== undefined) {
          // แปลง array/object เป็น JSON string
          if (
            Array.isArray(editingSong[key]) ||
            typeof editingSong[key] === "object"
          ) {
            formData.append(key, JSON.stringify(editingSong[key]));
          } else {
            formData.append(key, editingSong[key]);
          }
        }
      }

      await axios.put(
        `http://localhost:5000/api/admin/songs/${editingSong._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire("Success", "อัปเดตเพลงเรียบร้อย", "success");
      setEditingSong(null);
      fetchSongs();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "อัปเดตเพลงไม่สำเร็จ", "error");
    }
  };

  return (
    <div className="admin-songs-wrapper">
      <h2>🎵 Songs Management</h2>

      <div className="song-grid">
        {songs.map((song) => (
          <div className="song-box" key={song._id}>
            <div className="song-info">
              <h3>{song.title}</h3>
              <p>{song.artist}</p>
            </div>
            <div className="song-tags">
              {song.type && <span>#{song.type}</span>}
              {song.subtype && <span>#{song.subtype}</span>}
            </div>
            <div className="song-meta">
              {song.bpm && <span>{song.bpm} BPM</span>}
            </div>
            <div className="song-controls">
              <button onClick={() => openEditModal(song)}>Edit</button>
              <button onClick={() => handleDelete(song._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editingSong && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>แก้ไขเพลง</h3>
            <input
              type="text"
              value={editingSong.title || ""}
              onChange={(e) =>
                setEditingSong({ ...editingSong, title: e.target.value })
              }
            />
            <input
              type="text"
              value={editingSong.artist || ""}
              onChange={(e) =>
                setEditingSong({ ...editingSong, artist: e.target.value })
              }
            />
            <input
              type="text"
              value={editingSong.type || ""}
              onChange={(e) =>
                setEditingSong({ ...editingSong, type: e.target.value })
              }
            />
            <input
              type="text"
              value={editingSong.subtype || ""}
              onChange={(e) =>
                setEditingSong({ ...editingSong, subtype: e.target.value })
              }
            />
            <input
              type="number"
              value={editingSong.bpm || 0}
              onChange={(e) =>
                setEditingSong({ ...editingSong, bpm: Number(e.target.value) })
              }
            />
            <input
              type="text"
              value={editingSong.tags ? editingSong.tags.join(",") : ""}
              onChange={(e) =>
                setEditingSong({
                  ...editingSong,
                  tags: e.target.value.split(",").map((t) => t.trim()),
                })
              }
              placeholder="tags separated by comma"
            />
            <div className="modal-buttons">
              <button onClick={handleEditSave}>Save</button>
              <button onClick={() => setEditingSong(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSongs;
