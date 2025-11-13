import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlay, FaPause, FaDownload, FaArrowLeft } from "react-icons/fa";
import "./SongDetail.css";

function SongDetail() {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/songs/${id}`);
        setSong(res.data);
      } catch (err) {
        console.error(err);
        alert("ไม่พบข้อมูลเพลงนี้");
        navigate(-1);
      }
    };
    fetchSong();
  }, [id, navigate]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `http://localhost:5000/${song.filePath}`;
    link.download = song.title || "song.mp3";
    link.click();
  };

  if (!song) return <p className="loading">กำลังโหลดข้อมูลเพลง...</p>;

  return (
    <div className="song-detail-wrapper">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> กลับ
      </button>

      <div className="song-header">
        <h1>{song.title}</h1>
        <p className="artist-name">{song.artist}</p>
      </div>

      <div className="song-info">
        <p><strong>ประเภท:</strong> {song.type} / {song.subtype}</p>
        <p><strong>BPM:</strong> {song.bpm}</p>
        <p><strong>Key / Mode:</strong> {song.key} / {song.mode}</p>
        <p><strong>Sound Type:</strong> {song.soundType}</p>
        <p><strong>Likes:</strong> {song.likes} 💖</p>
        <p><strong>Downloads:</strong> {song.downloads} ⬇</p>
        <p><strong>Tags:</strong> {song.tags.join(", ")}</p>
        <p><strong>คำอธิบาย:</strong> {song.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p>
      </div>

      <div className="player-section">
        <audio ref={audioRef} src={`http://localhost:5000/${song.filePath}`} onEnded={() => setIsPlaying(false)} />
        <div className="controls">
          <button className="song-play-btn" onClick={handlePlayPause}>
            {isPlaying ? <FaPause /> : <FaPlay />} {isPlaying ? "หยุด" : "เล่นเพลง"}
          </button>
          <button className="song-download-btn" onClick={handleDownload}>
            <FaDownload /> ดาวน์โหลด
          </button>
        </div>
      </div>
    </div>
  );
}

export default SongDetail;
