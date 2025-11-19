import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; 
import { FaPlay, FaPause, FaDownload, FaArrowLeft } from "react-icons/fa";
import "./SongDetail.css";

function SongDetail() {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSong = async () => {
      try {
        if (!token) {
          Swal.fire({
            icon: "error",
            title: "ยังไม่ได้เข้าสู่ระบบ",
            text: "กรุณาเข้าสู่ระบบก่อนดูรายละเอียดเพลง",
          });
          navigate(-1);
          return;
        }

        const res = await axios.get(`http://localhost:5000/api/songs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSong(res.data);
      } catch (err) {
        console.error("Fetch song error:", err);
        Swal.fire({
          icon: "error",
          title: "ไม่พบเพลงนี้ หรือเกิดข้อผิดพลาด",
          text: "กลับหน้าก่อนหน้า",
        });
        navigate(-1);
      }
    };

    fetchSong();
  }, [id, navigate, token]);

  // เล่น/หยุดเพลง
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // อัปเดตเวลาเพลง
  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ดาวน์โหลดเพลง
  const handleDownload = async () => {
    if (!song) return;
    try {
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "ยังไม่ได้เข้าสู่ระบบ",
          text: "กรุณาเข้าสู่ระบบก่อนดาวน์โหลดเพลง",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/${song.filePath || ""}`,
        { responseType: "blob", headers: { Authorization: `Bearer ${token}` } }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${song.title || "เพลง"}.mp3`);
      link.click();
      link.remove();

      Swal.fire({
        icon: "success",
        title: "ดาวน์โหลดสำเร็จ",
        text: `"${song.title || "เพลง"}" ถูกดาวน์โหลดเรียบร้อยแล้ว 🎵`,
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
        text: "ไม่สามารถดาวน์โหลดเพลงได้",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  if (!song) return <p className="loading">กำลังโหลดข้อมูลเพลง... หรือไม่มีข้อมูล</p>;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="song-detail-wrapper">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> กลับ
      </button>

      <div className="song-header">
        <h1>{song.title || "ไม่มีชื่อเพลง"}</h1>
        <p className="artist-name">{song.artist || "ไม่ระบุศิลปิน"}</p>
      </div>

      <div className="song-info">
        <p><strong>คำอธิบาย:</strong> {song.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p>
        <p><strong>ประเภท:</strong> {song.type || "ไม่ระบุ"} / {song.subtype || "ไม่ระบุ"}</p>
        <p><strong>BPM:</strong> {song.bpm ?? "ไม่ระบุ"}</p>
        <p><strong>Key / Mode:</strong> {song.key || "ไม่ระบุ"} / {song.mode || "ไม่ระบุ"}</p>
        <p><strong>Sound Type:</strong> {song.soundType || "ไม่ระบุ"}</p>
        <p><strong>Likes:</strong> {song.likes ?? 0} 💖</p>
        <p><strong>Downloads:</strong> {song.downloads ?? 0} ⬇</p>
        <p><strong>Tags:</strong> {song.tags && song.tags.length > 0 ? song.tags.join(", ") : "ไม่มี tag"}</p>
      </div>

      <div className="player-section">
        <audio
          ref={audioRef}
          src={`http://localhost:5000/${song.filePath || ""}`}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      

        {/* Progress bar */}
        <div className="song-progress">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>

        <div className="controls">
          <button className="song-play-btn" onClick={handlePlayPause}>
            {isPlaying ? <FaPause /> : <FaPlay />} {isPlaying ? "หยุด" : "เล่นเพลง"}
          </button>

          <button className="song-download-btn" onClick={handleDownload}>
            <FaDownload /> ดาวน์โหลด
          </button>
        </div>

        <p className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</p>
      </div>
    </div>
  );
}

export default SongDetail;
