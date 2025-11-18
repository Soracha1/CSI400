import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";


function Profiledownload() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [durations, setDurations] = useState({});
  const [currentTimes, setCurrentTimes] = useState({});
  const [favorites, setFavorites] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchDownloads();
    loadFavorites();

    const handleDownloadSuccess = () => {
      console.log("Download detected, refreshing...");
      fetchDownloads();
    };

    window.addEventListener("downloadSuccess", handleDownloadSuccess);
    return () => {
      window.removeEventListener("downloadSuccess", handleDownloadSuccess);
    };
  }, []);

  const fetchDownloads = async () => {
    try {
      if (!user?._id) {
        console.log("No user ID found");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `http://localhost:5000/api/user/${user._id}/downloads`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Downloads data:", res.data);
      setDownloads(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching downloads:", err);
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user._id || !token) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/user/${user._id}/favorites`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFavorites(res.data.map(song => song._id));
    } catch (err) {
      console.error("Error loading favorites:", err);
    }
  };

  const handleLike = async (id) => {
    try {
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "กรุณาเข้าสู่ระบบ",
          text: "คุณต้องเข้าสู่ระบบก่อนกดถูกใจ",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        return;
      }

      const isFav = favorites.includes(id);

      if (isFav) {
        await axios.delete(
          `http://localhost:5000/api/songs/${id}/favorite`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites(prev => prev.filter(f => f !== id));
      } else {
        await axios.post(
          `http://localhost:5000/api/songs/${id}/favorite`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites(prev => [...prev, id]);
      }

      window.dispatchEvent(new Event("favoriteChanged"));
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDownload = async (song) => {
    try {
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "คุณยังไม่ได้เข้าสู่ระบบ",
          text: "กรุณาเข้าสู่ระบบก่อนดาวน์โหลดเพลง",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        return;
      }

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
      <div className="uploads-container">
        <p className="loading-text">กำลังโหลด...</p>
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <div className="uploads-container">
        <div className="no-upload">
          <h2>📥 ยังไม่มีประวัติการดาวน์โหลด</h2>
          <p>ลองดาวน์โหลดเพลงจากหน้าแรกดูสิ 🎵</p>
        </div>
      </div>
    );
  }

  return (
    <div className="songlist-wrapper">
      <div className="song-grid">
        {downloads.map((item) => {
          const song = item.song;
          
          if (!song) {
            return (
              <div className="song-box" key={item._id}>
                <div className="song-info">
                  <p style={{ textAlign: "center", color: "#999" }}>
                    เพลงนี้ถูกลบไปแล้ว
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div
              className="song-box"
              key={song._id}
              onClick={() => navigate(`/song/${song._id}`)}
              style={{ cursor: "pointer" }}
            >
              <div
                className="heart-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(song._id);
                }}
              >
                {favorites.includes(song._id) ? "💖" : "🤍"}
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
          );
        })}
      </div>
    </div>
  );
}

export default Profiledownload;