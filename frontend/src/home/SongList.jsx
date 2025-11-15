import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterTag]);

  useEffect(() => {
    setFilterTag(null);
  }, [searchTerm]);

  useEffect(() => {
    loadAllData();
  }, []);
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterTag]);
  useEffect(() => {
    if (searchTerm) setFilterTag(null);
  }, [searchTerm]);

  const token = localStorage.getItem("token");

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

  const handleLike = async (id) => {
    try {
      setFavorites((prev) =>
        prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
      );

      await axios.post(
        `http://localhost:5000/api/songs/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      loadAllData();
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDownload = async (song) => {
    try {
      // ดาวน์โหลดไฟล์
      const link = document.createElement("a");
      link.href = `http://localhost:5000/${song.filePath}`;
      link.download = `${song.title}.mp3`;
      link.click();

      // เพิ่ม download count ใน backend
      await axios.post(
        `http://localhost:5000/api/songs/${song._id}/download`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.post(`http://localhost:5000/api/songs/${song._id}/download`);
      loadAllData();
    } catch (err) {
      console.error("Download error:", err);
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

      // อัปเดตเวลาเล่น
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
          className={`song-play-btn ${
            currentPlaying === song._id ? "active" : ""
          }`}
          onClick={() => togglePlay(song._id)}
        >
          {currentPlaying === song._id ? "⏹ หยุด" : "▶ เล่น"}
        </button>
      

        <button
          className="song-download-btn"
          onClick={() => handleDownload(song)}
        >
          ⬇ ดาวน์โหลด
        </button>

       
        <button
          className="song-download-btn"
          onClick={() => handleDownload(song)}
        >
          ⬇ ดาวน์โหลด
        </button>
      </div>

      {/* Progress Bar */}
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

      {/* Progress Bar */}
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
   
        
        🎵{" "}
        {filterTag
          ? `เพลงในหมวด "${filterTag}"`
          : searchTerm
          ? "ผลการค้นหา"
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
