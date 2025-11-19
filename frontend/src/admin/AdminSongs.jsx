import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminSongs.css";

function AdminSongs() {
  const [songs, setSongs] = useState([]);
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

  // เปิด popup แก้ไข
  const openEditModal = async (song) => {
    // รายการ Tags ที่มีให้เลือก
    const availableTags = [
      'Bittersweet', 'Calm', 'Chilled', 'Confident', 'Relaxed', 'Romantic',
      'Seductive', 'Serious', 'Cool', 'R B', 'Flowing', 'Groovy',
      'Electric Guitar', 'Electronic Drums', 'Percussion', 'Piano', 'Synth', 'Male'
    ];

    const { value: formValues } = await Swal.fire({
      title: "✏️ แก้ไขเพลง",
      html: `
        <div style="text-align: left; padding: 10px; max-height: 70vh; overflow-y: auto;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #e0e0e0;">ชื่อเพลง:</label>
          <input id="swal-title" class="swal2-input" placeholder="ชื่อเพลง" value="${song.title || ''}" style="width: 90%; margin: 0 0 15px 0; background: #2d3748; color: #fff; border: 1px solid #4a5568;">
          
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #e0e0e0;">ศิลปิน:</label>
          <input id="swal-artist" class="swal2-input" placeholder="ศิลปิน" value="${song.artist || ''}" style="width: 90%; margin: 0 0 15px 0; background: #2d3748; color: #fff; border: 1px solid #4a5568;">
          
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #e0e0e0;">รายละเอียด:</label>
          <textarea id="swal-description" class="swal2-textarea" placeholder="รายละเอียด" style="width: 90%; margin: 0 0 15px 0; background: #2d3748; color: #fff; border: 1px solid #4a5568; min-height: 80px;">${song.description || ''}</textarea>
          
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #e0e0e0;">ประเภทการวาง:</label>
          <div style="margin-bottom: 15px;">
            <label style="color: #e0e0e0; margin-right: 20px; cursor: pointer;">
              <input type="radio" name="loopType" value="Loop" ${song.loopType === 'Loop' ? 'checked' : ''}> Loop
            </label>
            <label style="color: #e0e0e0; cursor: pointer;">
              <input type="radio" name="loopType" value="One Shot" ${song.loopType === 'One Shot' ? 'checked' : ''}> One Shot
            </label>
          </div>
          
          <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #e0e0e0;">แท็ก (Tags) - เลือกได้หลายอัน:</label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; padding: 10px; background: #2d3748; border-radius: 5px; border: 1px solid #4a5568;">
            ${availableTags.map(tag => {
              const isChecked = song.tags && song.tags.includes(tag);
              return `
                <label class="tag-checkbox" style="
                  display: inline-flex; 
                  align-items: center; 
                  padding: 8px 12px; 
                  background: ${isChecked ? '#5a67d8' : '#1a202c'}; 
                  border: 1px solid ${isChecked ? '#5a67d8' : '#4a5568'}; 
                  border-radius: 5px; 
                  cursor: pointer; 
                  color: #fff; 
                  font-size: 14px;
                  transition: all 0.2s;
                " onclick="this.style.background = this.querySelector('input').checked ? '#1a202c' : '#5a67d8'; this.style.borderColor = this.querySelector('input').checked ? '#4a5568' : '#5a67d8';">
                  <input type="checkbox" name="tags" value="${tag}" ${isChecked ? 'checked' : ''} style="display: none;">
                  ${tag}
                </label>
              `;
            }).join('')}
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #e0e0e0;">BPM:</label>
              <input id="swal-bpm" class="swal2-input" type="number" placeholder="BPM" value="${song.bpm || 0}" style="width: 90%; margin: 0; background: #2d3748; color: #fff; border: 1px solid #4a5568;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #e0e0e0;">KEY:</label>
              <select id="swal-key" class="swal2-select" style="width: 90%; margin: 0; background: #2d3748; color: #fff; border: 1px solid #4a5568; padding: 10px;">
                <option value="">เลือก Key</option>
                ${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => 
                  `<option value="${key}" ${song.key === key ? 'selected' : ''}>${key}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          
          <label style="display: block; margin-top: 15px; margin-bottom: 5px; font-weight: bold; color: #e0e0e0;">MODE:</label>
          <select id="swal-mode" class="swal2-select" style="width: 95%; margin: 0 0 15px 0; background: #2d3748; color: #fff; border: 1px solid #4a5568; padding: 10px;">
            <option value="">None</option>
            <option value="Major" ${song.mode === 'Major' ? 'selected' : ''}>Major</option>
            <option value="Minor" ${song.mode === 'Minor' ? 'selected' : ''}>Minor</option>
          </select>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #e0e0e0;">ประเภท (Type):</label>
              <select id="swal-type" class="swal2-select" style="width: 90%; margin: 0; background: #2d3748; color: #fff; border: 1px solid #4a5568; padding: 10px;">
                <option value="">เลือกประเภท</option>
                ${['keys', 'bass', 'drums', 'melody', 'fx'].map(type => 
                  `<option value="${type}" ${song.type === type ? 'selected' : ''}>${type}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #e0e0e0;">ประเภทย่อย (Subtype):</label>
              <input id="swal-subtype" class="swal2-input" placeholder="ประเภทย่อย" value="${song.subtype || ''}" style="width: 90%; margin: 0; background: #2d3748; color: #fff; border: 1px solid #4a5568;">
            </div>
          </div>
        </div>
      `,
      background: '#1a202c',
      color: '#fff',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "💾 บันทึก",
      cancelButtonText: "❌ ยกเลิก",
      confirmButtonColor: '#5a67d8',
      cancelButtonColor: '#718096',
      customClass: {
        container: 'edit-song-popup',
        popup: 'edit-song-popup-content'
      },
      width: '700px',
      preConfirm: () => {
        const title = document.getElementById("swal-title").value;
        const artist = document.getElementById("swal-artist").value;
        const description = document.getElementById("swal-description").value;
        const loopType = document.querySelector('input[name="loopType"]:checked')?.value;
        const type = document.getElementById("swal-type").value;
        const subtype = document.getElementById("swal-subtype").value;
        const bpm = document.getElementById("swal-bpm").value;
        const key = document.getElementById("swal-key").value;
        const mode = document.getElementById("swal-mode").value;
        
        // รับค่า tags ที่เลือก
        const selectedTags = Array.from(document.querySelectorAll('input[name="tags"]:checked'))
          .map(checkbox => checkbox.value);

        if (!title || !artist) {
          Swal.showValidationMessage("กรุณากรอกชื่อเพลงและศิลปิน");
          return false;
        }

        return {
          title,
          artist,
          description,
          loopType,
          type,
          subtype,
          bpm: Number(bpm),
          key,
          mode,
          tags: selectedTags
        };
      }
    });

    if (formValues) {
      await handleEditSave(song._id, formValues);
    }
  };

  // บันทึกแก้ไขเพลง
  const handleEditSave = async (songId, updatedData) => {
    try {
      // ส่งข้อมูลแบบ JSON แทน FormData
      await axios.put(
        `http://localhost:5000/api/admin/songs/${songId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "อัปเดตเพลงเรียบร้อย",
        timer: 2000,
        showConfirmButton: false
      });
      
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

  const getProgressPercentage = (songId) => {
    const duration = durations[songId] || 0;
    const currentTime = currentTimes[songId] || 0;
    if (duration === 0) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  };

  return (
    <div className="admin-songs-wrapper" style={{ paddingTop: '80px' }}>
      <h2 className="adminsong-title">🎵 Songs Management</h2>

      <div className="song-grid">
        {songs.map((song) => (
          <div
            className="song-box"
            key={song._id}
            onClick={() => navigate(`/song/${song._id}`)}
          >
            {/* Wave Animation */}
            <div className="song-info">
              <div
                className={`wave-anim ${
                  currentPlaying === song._id ? "active" : ""
                }`}
              >
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <h3>{song.title}</h3>
              <p>{song.artist}</p>
            </div>

            {/* Tags */}
            {song.type && song.subtype && (
              <div className="song-tags">
                <span>#{song.type}</span>
                <span>#{song.subtype}</span>
              </div>
            )}

            {/* Meta Info */}
            <div className="song-meta">
              <span>
                ⏱ {formatTime(currentTimes[song._id] || 0)} /{" "}
                {formatTime(durations[song._id] || 0)}
              </span>
              {song.bpm && <span>{song.bpm} BPM</span>}
            </div>

            {/* Controls */}
            <div className="song-controls" onClick={(e) => e.stopPropagation()}>
              <button
                className={`song-play-btn ${
                  currentPlaying === song._id ? "active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay(song._id);
                }}
              >
                {currentPlaying === song._id ? "⏹ หยุด" : "▶ เล่น"}
              </button>
              <button
                className="song-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(song);
                }}
              >
                ✏️ แก้ไข
              </button>
              <button
                className="song-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(song._id);
                }}
              >
                🗑️ ลบ
              </button>
            </div>

            {/* Progress Bar */}
            <div className="song-progress">
              <div
                className="progress-fill"
                style={{ width: `${getProgressPercentage(song._id)}%` }}
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
    </div>
  );
}

export default AdminSongs;