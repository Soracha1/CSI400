import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./SongList.css";

function SongList({ searchTerm }) {
  const [songs, setSongs] = useState([]);
  const [topLikes, setTopLikes] = useState([]);
  const [topDownloads, setTopDownloads] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [durations, setDurations] = useState({});
  const [currentTimes, setCurrentTimes] = useState({});

  const navigate = useNavigate();
  const songsPerPage = 5;

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadAllData();
    loadFavorites();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterTag]);

  useEffect(() => {
    setFilterTag(null);
  }, [searchTerm]);

  const loadAllData = async () => {
    try {
      const [allRes, likesRes, dlRes] = await Promise.all([
        axios.get("http://localhost:5000/api/songs"),
        axios.get("http://localhost:5000/api/songs/top-likes"),
        axios.get("http://localhost:5000/api/songs/top-downloads"),
      ]);
      setSongs(allRes.data);
      setTopLikes(likesRes.data);
      setTopDownloads(dlRes.data);
    } catch (err) {
      console.error("Error loading songs:", err);
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
        // Remove from favorites
        await axios.delete(
          `http://localhost:5000/api/songs/${id}/favorite`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites(prev => prev.filter(f => f !== id));
      } else {
        // Add to favorites
        await axios.post(
          `http://localhost:5000/api/songs/${id}/favorite`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites(prev => [...prev, id]);
      }

      // Trigger event for Profilefavorites to refresh
      window.dispatchEvent(new Event("favoriteChanged"));
      
      loadAllData();
    } catch (err) {
      console.error("Like error:", err);
      if (err.response?.status === 400 && err.response?.data?.message === "Already in favorites") {
        setFavorites(prev => [...prev, id]);
      }
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

      // ดาวน์โหลดเพลงเป็น blob
      const response = await axios.get(`http://localhost:5000/${song.filePath}`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${song.title}.mp3`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // เพิ่ม download count ใน backend
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

      loadAllData();
    } catch (err) {
      console.error("Download error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.response?.data?.message || `ไม่สามารถดาวน์โหลดเพลง "${song.title}" ได้`,
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

  const normalize = (text) => text?.toString().trim().toLowerCase() || "";

  let filteredSongs = songs;
  if (searchTerm && searchTerm.trim() !== "") {
    const term = normalize(searchTerm);
    filteredSongs = songs.filter(
      (s) =>
        normalize(s.title).includes(term) ||
        normalize(s.artist).includes(term) ||
        normalize(s.type).includes(term) ||
        normalize(s.subtype).includes(term) ||
        normalize(s.bpm).includes(term)
    );
  }
  if (filterTag) {
    filteredSongs = filteredSongs.filter(
      (s) =>
        normalize(s.type) === normalize(filterTag) ||
        normalize(s.subtype) === normalize(filterTag)
    );
  }

  const totalPages = Math.ceil(filteredSongs.length / songsPerPage);
  const displayedSongs = filteredSongs.slice(
    currentPage * songsPerPage,
    currentPage * songsPerPage + songsPerPage
  );

  const renderSongBox = (song) => (
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

      <div className="song-tags">
        <span
          onClick={(e) => {
            e.stopPropagation();
            setFilterTag(song.type);
          }}
        >
          #{song.type}
        </span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            setFilterTag(song.subtype);
          }}
        >
          #{song.subtype}
        </span>
      </div>

      <div className="song-meta">
        <span>
          ⏱ {formatTime(currentTimes[song._id] || 0)} /{" "}
          {formatTime(durations[song._id] || 0)}
        </span>
        <span>{song.bpm} BPM</span>
      </div>

      <div className="song-controls" onClick={(e) => e.stopPropagation()}>
        <button
          className={`song-play-btn ${currentPlaying === song._id ? "active" : ""}`}
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
          setDurations((prev) => ({ ...prev, [song._id]: e.target.duration }))
        }
      />
    </div>
  );

  return (
    <div className="songlist-wrapper">
      {!searchTerm && !filterTag && (
        <>
          <h2 className="songlist-title">💖 เพลงที่ถูกใจมากที่สุด</h2>
          <div className="song-grid">{topLikes.map(renderSongBox)}</div>
          <h2 className="songlist-title">⬇ เพลงที่ถูกดาวน์โหลดมากที่สุด</h2>
          <div className="song-grid">{topDownloads.map(renderSongBox)}</div>
        </>
      )}

      <h2 className="songlist-title">
        🎵{" "}
        {filterTag
          ? `เพลงในหมวด "${filterTag}"`
          : searchTerm
          ? "เพลงที่ค้นหา"
          : "เพลงทั้งหมด"}
      </h2>
      <div className="song-grid">{displayedSongs.map(renderSongBox)}</div>

      {totalPages > 1 && (
        <div className="pagination-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <span
              key={i}
              className={`dot ${i === currentPage ? "active" : ""}`}
              onClick={() => setCurrentPage(i)}
            ></span>
          ))}
        </div>
      )}

      {filterTag && (
        <button className="clear-filter" onClick={() => setFilterTag(null)}>
          ❌ ล้างตัวกรอง
        </button>
      )}
    </div>
  );
}

export default SongList;