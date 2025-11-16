import React, { useEffect, useState } from "react";
import "./Profileuploads.css";

function Profileuploads() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  const [uploads, setUploads] = useState([]);
  const [playingSongId, setPlayingSongId] = useState(null);

  const fetchUploads = async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/user/${userId}/uploads`);
      const data = await res.json();
      console.log("User uploads:", data);
      setUploads(data);
    } catch (err) {
      console.error("Error fetching uploads:", err);
    }
  };

  useEffect(() => {
    fetchUploads();

    // Listen for upload events
    const handleUploadSuccess = () => {
      console.log("Upload successful, refreshing...");
      fetchUploads();
    };

    window.addEventListener("uploadSuccess", handleUploadSuccess);

    return () => {
      window.removeEventListener("uploadSuccess", handleUploadSuccess);
    };
  }, [userId]);

  const handlePlay = (songId) => {
    if (playingSongId === songId) {
      setPlayingSongId(null);
    } else {
      setPlayingSongId(songId);
    }
  };

  const handleLike = async (songId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/songs/${songId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUploads();
    } catch (err) {
      console.error("Error liking song:", err);
    }
  };

  const handleDownload = async (songId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/songs/${songId}/download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUploads();
    } catch (err) {
      console.error("Error downloading song:", err);
    }
  };

  return (
    <div className="uploads-container">
      {uploads.length === 0 ? (
        <p className="no-upload">No upload yet.</p>
      ) : (
        <div className="uploads-grid">
          {uploads.map((song) => (
            <div key={song._id} className="sound-card">
              {/* Heart Icon */}
              <div className="heart-icon" onClick={() => handleLike(song._id)}>
                🤍
              </div>

              {/* Waveform */}
              <div className="waveform">
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
              </div>

              {/* Title */}
              <div className="sound-title">{song.title}</div>

              {/* Artist */}
              <p className="artist">{song.artist}</p>

              {/* Tags */}
              <div className="tags">
                {song.tags?.slice(0, 2).map((tag, idx) => (
                  <span key={idx}>#{tag}</span>
                ))}
              </div>

              {/* Bottom section */}
              <div className="bottom">
                <span className="bpm">{song.bpm || 0} BPM</span>
                <button 
                  className="play-btn"
                  onClick={() => handlePlay(song._id)}
                >
                  {playingSongId === song._id ? "⏸" : "▶"}
                </button>
              </div>

              {/* Hidden Audio */}
              {playingSongId === song._id && (
                <audio
                  autoPlay
                  onEnded={() => setPlayingSongId(null)}
                  src={`http://localhost:5000/${song.filePath?.replace(/\\/g, "/")}`}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profileuploads;