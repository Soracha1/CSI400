import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Profilefovorites.css";

function Profilefavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [durations, setDurations] = useState({});
  const [currentTimes, setCurrentTimes] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchFavorites();

    const handleFavoriteChange = () => {
      console.log("Favorite changed, refreshing...");
      fetchFavorites();
    };

    window.addEventListener("favoriteChanged", handleFavoriteChange);
    return () => {
      window.removeEventListener("favoriteChanged", handleFavoriteChange);
    };
  }, []);

  const fetchFavorites = async () => {
    try {
      if (!user?._id || !token) {
        console.log("No user ID or token found");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `http://localhost:5000/api/user/${user._id}/favorites`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Favorites data:", res.data);
      setFavorites(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setLoading(false);
    }
  };

  const handleUnfavorite = async (songId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/songs/${songId}/favorite`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFavorites(prev => prev.filter(song => song._id !== songId));
      window.dispatchEvent(new Event("favoriteChanged"));

      Swal.fire({
        icon: "success",
        title: "ลบออกจากรายการโปรดแล้ว",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (err) {
      console.error("Error removing favorite:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถลบออกจากรายการโปรดได้",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  const handleDownload = async (song) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/${song.filePath}`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${song.title}.mp3`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      await axios.post(
        `http://localhost:5000/api/songs/${song._id}/download`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: "ดาวน์โหลดเพลงสำเร็จ 🎵",
        text: `คุณดาวน์โหลดเพลง "${song.title}" เรียบร้อยแล้ว`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (err) {
      console.error("Download error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: `ไม่สามารถดาวน์โหลดเพลง "${song.title}" ได้`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

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

  if (loading) {
    return (
      <div className="profile-favorites-container">
        <p className="loading-text">กำลังโหลด...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="profile-favorites-container">
        <div className="no-favorites">
          <h2>💔 ยังไม่มีเพลงที่ชอบ</h2>
          <p>กดปุ่มหัวใจที่เพลงที่คุณชอบเพื่อเพิ่มในรายการนี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="songlist-wrapper">
      
      
      <div className="song-grid">
        {favorites.map((song) => (
          <div
            className="song-box"
            key={song._id}
            onClick={() => navigate(`/song/${song._id}`)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="heart-icon favorited"
              onClick={(e) => {
                e.stopPropagation();
                handleUnfavorite(song._id);
              }}
            >
              💖
            </div>

            <div className="wave-anim">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="song-info">
              <h3>{song.title}</h3>
              <p>{song.artist}</p>
            </div>

            {song.type && song.subtype && (
              <div className="song-tags">
                <span>#{song.type}</span>
                <span>#{song.subtype}</span>
              </div>
            )}

            <div className="song-meta">
              <span>
                ⏱ {formatTime(currentTimes[song._id] || 0)} /{" "}
                {formatTime(durations[song._id] || 0)}
              </span>
              {song.bpm && <span>{song.bpm} BPM</span>}
            </div>

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
                className="song-download-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(song);
                }}
              >
                ⬇ ดาวน์โหลด
              </button>
            </div>

            <div className="song-progress">
              <div
                className="progress-fill"
                style={{
                  width: durations[song._id]
                    ? `${(currentTimes[song._id] / durations[song._id]) * 100}%`
                    : "0%",
                }}
              ></div>
            </div>

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

export default Profilefavorites;