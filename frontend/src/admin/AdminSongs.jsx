import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

function AdminSongs() {
  const [songs, setSongs] = useState([]);
  const [editingSong, setEditingSong] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [durations, setDurations] = useState({});
  const [currentTimes, setCurrentTimes] = useState({});
  
  const navigate = useNavigate();
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
      cancelButtonText: "ยกเลิก",
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

  // ฟังก์ชันเล่นเพลง
  const togglePlay = (id) => {
    const audio = document.getElementById(`audio-${id}`);
    if (!audio) return;

    if (currentPlaying && currentPlaying !== id) {
      const prevAudio = document.getElementById(`audio-${currentPlaying}`);
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    if (audio.paused) {
      audio.play();
      setCurrentPlaying(id);

      const interval = setInterval(() => {
        setCurrentTimes((prev) => ({ ...prev, [id]: audio.currentTime }));
      }, 200);

      audio.onended = () => {
        clearInterval(interval);
        setCurrentPlaying(null);
        setCurrentTimes((prev) => ({ ...prev, [id]: 0 }));
      };
    } else {
      audio.pause();
      audio.currentTime = 0;
      setCurrentPlaying(null);
      setCurrentTimes((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>🎵 Songs Management</h2>

      <div style={styles.songGrid}>
        {songs.map((song) => (
          <div
            style={styles.songBox}
            key={song._id}
            onClick={() => navigate(`/song/${song._id}`)}
          >
            {/* Wave Animation */}
            <div style={styles.waveAnim}>
              <span style={styles.waveBar}></span>
              <span style={styles.waveBar}></span>
              <span style={styles.waveBar}></span>
              <span style={styles.waveBar}></span>
              <span style={styles.waveBar}></span>
            </div>

            <div style={styles.songInfo}>
              <h3 style={styles.songTitle}>{song.title}</h3>
              <p style={styles.songArtist}>{song.artist}</p>
            </div>

            {song.type && song.subtype && (
              <div style={styles.songTags}>
                <span style={styles.tag}>#{song.type}</span>
                <span style={styles.tag}>#{song.subtype}</span>
              </div>
            )}

            <div style={styles.songMeta}>
              <span>
                ⏱ {formatTime(currentTimes[song._id] || 0)} /{" "}
                {formatTime(durations[song._id] || 0)}
              </span>
              {song.bpm && <span>{song.bpm} BPM</span>}
            </div>

            <div style={styles.songControls} onClick={(e) => e.stopPropagation()}>
              <button
                style={{
                  ...styles.playBtn,
                  ...(currentPlaying === song._id ? styles.playBtnActive : {}),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay(song._id);
                }}
              >
                {currentPlaying === song._id ? "⏹ หยุด" : "▶ เล่น"}
              </button>
              <button
                style={styles.editBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(song);
                }}
              >
                ✏️ แก้ไข
              </button>
              <button
                style={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(song._id);
                }}
              >
                🗑️ ลบ
              </button>
            </div>

            {/* Progress Bar */}
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: durations[song._id]
                    ? `${(currentTimes[song._id] / durations[song._id]) * 100}%`
                    : "0%",
                }}
              ></div>
            </div>

            {/* Audio Element */}
            <audio
              id={`audio-${song._id}`}
              src={`http://localhost:5000/${song.filePath}`}
              onLoadedMetadata={(e) =>
                setDurations((prev) => ({
                  ...prev,
                  [song._id]: e.target.duration,
                }))
              }
            />
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingSong && (
        <div style={styles.modalOverlay} onClick={() => setEditingSong(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>✏️ แก้ไขเพลง</h3>
            
            <input
              type="text"
              placeholder="ชื่อเพลง"
              style={styles.input}
              value={editingSong.title || ""}
              onChange={(e) =>
                setEditingSong({ ...editingSong, title: e.target.value })
              }
            />
            
            <input
              type="text"
              placeholder="ศิลปิน"
              style={styles.input}
              value={editingSong.artist || ""}
              onChange={(e) =>
                setEditingSong({ ...editingSong, artist: e.target.value })
              }
            />
            
            <input
              type="text"
              placeholder="ประเภท (Type)"
              style={styles.input}
              value={editingSong.type || ""}
              onChange={(e) =>
                setEditingSong({ ...editingSong, type: e.target.value })
              }
            />
            
            <input
              type="text"
              placeholder="ประเภทย่อย (Subtype)"
              style={styles.input}
              value={editingSong.subtype || ""}
              onChange={(e) =>
                setEditingSong({ ...editingSong, subtype: e.target.value })
              }
            />
            
            <input
              type="number"
              placeholder="BPM"
              style={styles.input}
              value={editingSong.bpm || 0}
              onChange={(e) =>
                setEditingSong({ ...editingSong, bpm: Number(e.target.value) })
              }
            />
            
            <input
              type="text"
              placeholder="Tags (คั่นด้วย comma)"
              style={styles.input}
              value={editingSong.tags ? editingSong.tags.join(",") : ""}
              onChange={(e) =>
                setEditingSong({
                  ...editingSong,
                  tags: e.target.value.split(",").map((t) => t.trim()),
                })
              }
            />
            
            <div style={styles.modalButtons}>
              <button style={styles.saveBtn} onClick={handleEditSave}>
                💾 บันทึก
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => setEditingSong(null)}
              >
                ❌ ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles
const styles = {
  wrapper: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "30px",
    textAlign: "center",
    color: "#fff",
  },
  songGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  songBox: {
    background: "linear-gradient(145deg, #1e1e2e, #2a2a3e)",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  },
  waveAnim: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: "5px",
    height: "50px",
    marginBottom: "15px",
  },
  waveBar: {
    display: "inline-block",
    width: "8px",
    height: "20px",
    background: "linear-gradient(to top, #00d4ff, #00ff88)",
    borderRadius: "10px",
    animation: "wave 1s ease-in-out infinite",
    animationDelay: "calc(var(--i) * 0.1s)",
  },
  songInfo: {
    marginBottom: "15px",
  },
  songTitle: {
    fontSize: "1.3rem",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "5px",
  },
  songArtist: {
    fontSize: "0.95rem",
    color: "#aaa",
  },
  songTags: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  tag: {
    background: "rgba(0, 212, 255, 0.2)",
    color: "#00d4ff",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.85rem",
  },
  songMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    color: "#999",
    marginBottom: "15px",
  },
  songControls: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  playBtn: {
    flex: 1,
    padding: "10px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },
  playBtnActive: {
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  editBtn: {
    flex: 1,
    padding: "10px",
    background: "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)",
    color: "#2d3436",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },
  deleteBtn: {
    flex: 1,
    padding: "10px",
    background: "linear-gradient(135deg, #ff7675 0%, #d63031 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },
  progressBar: {
    width: "100%",
    height: "6px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #00d4ff, #00ff88)",
    transition: "width 0.2s ease",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "linear-gradient(145deg, #1e1e2e, #2a2a3e)",
    padding: "30px",
    borderRadius: "20px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  modalTitle: {
    fontSize: "1.8rem",
    marginBottom: "20px",
    textAlign: "center",
    color: "#fff",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.3s ease",
  },
  modalButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  },
  saveBtn: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #00b894 0%, #00cec9 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #636e72 0%, #2d3436 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },
};

export default AdminSongs