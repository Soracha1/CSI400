import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SongList.css";


function SongList() {
  const [songs, setSongs] = useState([]);
  const [topLikes, setTopLikes] = useState([]);
  const [topDownloads, setTopDownloads] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [durations, setDurations] = useState({});
  const songsPerPage = 5;

  useEffect(() => {
    loadAllData();
  }, []);

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
      // optimistic UI toggle local favorites for UX
      setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
      await axios.post(`http://localhost:5000/api/songs/${id}/like`);
      loadAllData();
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDownload = async (song) => {
    try {
      const link = document.createElement("a");
      // song.filePath is like "uploads/music/xxxxx.mp3"
      link.href = `http://localhost:5000/${song.filePath}`;
      link.download = `${song.title}.mp3`;
      link.click();

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
    } else {
      audio.pause();
      audio.currentTime = 0;
      setCurrentPlaying(null);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "…";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const filteredSongs = filterTag ? songs.filter((s) => s.type === filterTag || s.subtype === filterTag || s.artist === filterTag) : songs;
  const totalPages = Math.ceil(filteredSongs.length / songsPerPage);
  const displayedSongs = filteredSongs.slice(currentPage * songsPerPage, currentPage * songsPerPage + songsPerPage);

  const renderSongBox = (song) => (
    <div className="song-box" key={song._id}>
      <div className="heart-icon" onClick={() => handleLike(song._id)}>
        {favorites.includes(song._id) ? "💖" : "🤍"}
      </div>

      <div className="waveform"></div>

      <div className="song-info">
        <h3 className="song-title">{song.title}</h3>
        <p className="song-artist">{song.artist}</p>
      </div>

      <div className="song-tags">
        <span onClick={() => setFilterTag(song.type)}>#{song.type}</span>
        <span onClick={() => setFilterTag(song.subtype)}>#{song.subtype}</span>
      </div>

      <div className="song-meta">
        <span className="duration">⏱ {formatTime(durations[song._id])}</span>
        <span className="bpm">{song.bpm} BPM</span>
      </div>

      <div className="song-controls">
        <button className="play-btn" onClick={() => togglePlay(song._id)}>{currentPlaying === song._id ? "⏸" : "▶"}</button>
        <button className="download-btn" onClick={() => handleDownload(song)}>⬇</button>
      </div>

      <audio id={`audio-${song._id}`} src={`http://localhost:5000/${song.filePath}`} onLoadedMetadata={(e) => setDurations((prev) => ({ ...prev, [song._id]: e.target.duration }))} />
    </div>
  );

  return (
    <div className="songlist-wrapper">
      <h2 className="songlist-title">🔥 เพลงที่ถูกใจมากที่สุด</h2>
      <div className="song-grid">
        {topLikes.map((s) => renderSongBox(s))}
      </div>

      <h2 className="songlist-title">⬇ เพลงที่ถูกดาวน์โหลดมากที่สุด</h2>
      <div className="song-grid">
        {topDownloads.map((s) => renderSongBox(s))}
      </div>

      <h2 className="songlist-title">🎵 {filterTag ? `เพลงในหมวด "${filterTag}"` : "เพลงทั้งหมด"}</h2>
      <div className="song-grid">
        {displayedSongs.map((s) => renderSongBox(s))}
      </div>

      {totalPages > 1 && (
        <div className="pagination-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <span key={i} className={`dot ${i === currentPage ? "active" : ""}`} onClick={() => setCurrentPage(i)}></span>
          ))}
        </div>
      )}

      {filterTag && <button className="clear-filter" onClick={() => setFilterTag(null)}>❌ ล้างตัวกรอง</button>}
    </div>
  );
}

export default SongList;
