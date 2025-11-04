import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SongList.css";

function SongList() {
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [currentPage, setCurrentPage] = useState(0); // เพิ่ม state สำหรับหน้า
  const songsPerPage = 5; // ✅ แสดง 5 เพลงต่อหน้า

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/songs")
      .then((res) => setSongs(res.data))
      .catch((err) => console.error("Error fetching songs:", err));
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleDownload = (filePath, title) => {
    const link = document.createElement("a");
    link.href = `http://localhost:5000/${filePath}`;
    link.download = `${title}.mp3`;
    link.click();
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
    } else {
      audio.pause();
      audio.currentTime = 0;
      setCurrentPlaying(null);
    }
  };

  const filteredSongs = filterTag
    ? songs.filter(
        (s) =>
          s.type === filterTag ||
          s.subtype === filterTag ||
          s.artist === filterTag
      )
    : songs;

  // ✅ ตัดเพลงให้เหลือเฉพาะหน้า
  const totalPages = Math.ceil(filteredSongs.length / songsPerPage);
  const displayedSongs = filteredSongs.slice(
    currentPage * songsPerPage,
    currentPage * songsPerPage + songsPerPage
  );

  return (
    <div className="songlist-wrapper">
      <h2 className="songlist-title">
        🎵 {filterTag ? `เพลงในหมวด "${filterTag}"` : "เพลงทั้งหมด"}
      </h2>

      <div className="song-grid">
        {displayedSongs.map((song) => (
          <div className="song-box" key={song._id}>
            {/* หัวใจ Favorite */}
            <div
              className="heart-icon"
              onClick={() => toggleFavorite(song._id)}
            >
              {favorites.includes(song._id) ? "💖" : "🤍"}
            </div>

            {/* Waveform */}
            <div className="waveform"></div>

            {/* ชื่อเพลง / ศิลปิน */}
            <div className="song-info">
              <h3 className="song-title">{song.title}</h3>
              <p className="song-artist">{song.artist}</p>
            </div>

            {/* TAG */}
            <div className="song-tags">
              <span onClick={() => setFilterTag(song.type)}>#{song.type}</span>
              <span onClick={() => setFilterTag(song.subtype)}>
                #{song.subtype}
              </span>
            </div>

            {/* เวลา + BPM */}
            <div className="song-meta">
              <span className="duration">
                ⏱ {Math.floor(Math.random() * 50) + 10}.s
              </span>
              <span className="bpm">{song.bpm} BPM</span>
            </div>

            {/* ปุ่ม Play + Download */}
            <div className="song-controls">
              <button
                className="play-btn"
                onClick={() => togglePlay(song._id)}
              >
                {currentPlaying === song._id ? "⏸" : "▶"}
              </button>

              <button
                className="download-btn"
                onClick={() => handleDownload(song.filePath, song.title)}
              >
                ⬇
              </button>
            </div>

            <audio
              id={`audio-${song._id}`}
              src={`http://localhost:5000/${song.filePath}`}
            />
          </div>
        ))}
      </div>

      {/* ✅ จุดเลื่อนหน้า (Pagination Dots) */}
      {totalPages > 1 && (
        <div className="pagination-dots">
          {Array.from({ length: totalPages }).map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentPage ? "active" : ""}`}
              onClick={() => setCurrentPage(index)}
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
