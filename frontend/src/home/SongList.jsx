import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./SongList.css";

function SongList() {
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef(null);

  const itemsPerPage = 4;

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/songs")
      .then((res) => setSongs(res.data))
      .catch((err) => console.error("Error fetching songs:", err));
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
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

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // ฟิลเตอร์เพลงตาม tag
  const filteredSongs = filterTag
    ? songs.filter(
        (s) =>
          s.type === filterTag ||
          s.subtype === filterTag ||
          s.artist === filterTag
      )
    : songs;

  const totalPages = Math.ceil(filteredSongs.length / itemsPerPage);
  const currentSongs = filteredSongs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="songlist-wrapper">
      <h2 className="songlist-title">
        🎵 {filterTag ? `เพลงในหมวด "${filterTag}"` : "เพลงทั้งหมด"}
      </h2>

      <div className="carousel-container">
        {/* <button className="scroll-btn left" onClick={() => scroll("left")}>
          ❮
        </button> */}

        <div className="song-grid" ref={scrollRef}>
          {currentSongs.map((song) => (
            <div className="song-card" key={song._id}>
              <div className="song-image">
                <div
                  className="heart-icon"
                  onClick={() => toggleFavorite(song._id)}
                >
                  {favorites.includes(song._id) ? "❤️" : "🤍"}
                </div>
                <div className="waveform"></div>
              </div>

              <div className="song-info">
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
                <div className="tags">
                  <span onClick={() => setFilterTag(song.type)}>
                    {song.type}
                  </span>
                  <span onClick={() => setFilterTag(song.subtype)}>
                    {song.subtype}
                  </span>
                </div>
                <div className="bpm">{song.bpm} BPM</div>
              </div>

              <div className="song-controls">
                <button
                  className="play-btn"
                  onClick={() => togglePlay(song._id)}
                >
                  {currentPlaying === song._id ? "⏸" : "▶"}
                </button>

                <div className="divider" />

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

        {/* <button className="scroll-btn right" onClick={() => scroll("right")}>
          ❯
        </button> */}
      </div>

      {/* จุดบอกหน้า */}
      <div className="pagination-dots">
        {Array.from({ length: totalPages }).map((_, i) => (
          <span
            key={i}
            className={`dot ${currentPage === i + 1 ? "active" : ""}`}
            onClick={() => setCurrentPage(i + 1)}
          ></span>
        ))}
      </div>

      {filterTag && (
        <button className="clear-filter" onClick={() => setFilterTag(null)}>
          ❌ ล้างตัวกรอง
        </button>
      )}
    </div>
  );
}

export default SongList;
