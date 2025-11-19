import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./SongList.css";

const BASE_URL = "http://localhost:5000";

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

  const audioIntervals = useRef({});
  const navigate = useNavigate();
  const songsPerPage = 5;

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const audioRefs = useRef({});

  useEffect(() => {
    loadAllData();
    loadFavorites();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterTag]);

  useEffect(() => {
    // Cleanup audio intervals on unmount
  return () => {
  Object.values(audioIntervals.current).forEach((interval) => {
    clearInterval(interval);
  });
  Object.values(audioRefs.current).forEach((audio) => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
};

  }, []);

  const loadAllData = async () => {
    try {
      const [allRes, likesRes, dlRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/songs`),
        axios.get(`${BASE_URL}/api/songs/top-likes`),
        axios.get(`${BASE_URL}/api/songs/top-downloads`),
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
        `${BASE_URL}/api/user/${user._id}/favorites`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFavorites(res.data.map((song) => song._id));
    } catch (err) {
      console.error("Error loading favorites:", err);
    }
  };

  const handleLike = async (id) => {
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "กรุณาเข้าสู่ระบบ",
        toast: true,
        position: "top-end",
        timer: 2000,
      });
      return;
    }
    try {
      const isFav = favorites.includes(id);
      if (isFav) {
        await axios.delete(`${BASE_URL}/api/songs/${id}/favorite`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites((prev) => prev.filter((f) => f !== id));
      } else {
        await axios.post(
          `${BASE_URL}/api/songs/${id}/favorite`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setFavorites((prev) => [...prev, id]);
      }

      window.dispatchEvent(new Event("favoriteChanged"));
      loadAllData();
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDownload = async (song) => {
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "กรุณาเข้าสู่ระบบ",
        toast: true,
        position: "top-end",
        timer: 2000,
      });
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/${song.filePath}`, {
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

      await axios.post(
        `${BASE_URL}/api/songs/${song._id}/download`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.fire({
        icon: "success",
        title: "ดาวน์โหลดเพลงสำเร็จ 🎵",
        toast: true,
        position: "top-end",
        timer: 2000,
      });
      loadAllData();
    } catch (err) {
      console.error("Download error:", err);
      Swal.fire({
        icon: "error",
        title: "ดาวน์โหลดล้มเหลว",
        toast: true,
        position: "top-end",
        timer: 2000,
      });
    }
  };

  const togglePlay = (id) => {
  const audio = audioRefs.current[id];
  if (!audio) return;

  // หยุดเพลงก่อนหน้า
  if (currentPlaying && currentPlaying !== id) {
    const prevAudio = audioRefs.current[currentPlaying];
    if (prevAudio) {
      prevAudio.pause();
      prevAudio.currentTime = 0;
      setCurrentTimes((prev) => ({ ...prev, [currentPlaying]: 0 }));
      clearInterval(audioIntervals.current[currentPlaying]);
    }
  }

  if (audio.paused) {
    audio.play();
    setCurrentPlaying(id);

    // ontimeupdate
    audio.ontimeupdate = () => {
      setCurrentTimes((prev) => ({ ...prev, [id]: audio.currentTime }));
    };

    // setInterval backup
    audioIntervals.current[id] = setInterval(() => {
      setCurrentTimes((prev) => ({ ...prev, [id]: audio.currentTime }));
    }, 200);

    audio.onended = () => {
      clearInterval(audioIntervals.current[id]);
      setCurrentPlaying(null);
      setCurrentTimes((prev) => ({ ...prev, [id]: 0 }));
    };
  } else {
    audio.pause();
    audio.currentTime = 0;
    clearInterval(audioIntervals.current[id]);
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

  const normalize = (text) => text?.toString().trim().toLowerCase() || "";

  let filteredSongs = songs;
  if (searchTerm?.trim()) {
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

      <div className="song-info">
        <div
          className={`wave-anim ${currentPlaying === song._id ? "active" : ""}`}
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
      </div>

      <div className="song-progress">
        <div
          className="progress-fill"
          style={{ width: `${getProgressPercentage(song._id)}%` }}
        ></div>
      </div>

   <audio
  ref={(el) => (audioRefs.current[song._id] = el)}
  id={`audio-${song._id}`}
  src={`${BASE_URL}/${song.filePath}`}
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
          <h2 className="songlist-title">💖 Most Liked!</h2>
          <div className="song-grid">{topLikes.map(renderSongBox)}</div>
          <h2 className="songlist-title">⬇ Most Downloaded</h2>
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
