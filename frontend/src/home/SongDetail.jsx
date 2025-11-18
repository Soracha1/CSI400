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
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/songs/${id}`);
        setSong(res.data);
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "ไม่พบเพลงนี้",
          text: "กลับหน้าก่อนหน้า",
        });
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

  const handleDownload = async () => {
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

      // 1. ตรวจสอบโควต้าจาก backend
      const quotaRes = await axios.get(
        `http://localhost:5000/api/users/download-quota`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!quotaRes.data.allowed) {
        Swal.fire({
          icon: "error",
          title: "โควต้าดาวน์โหลดเต็ม",
          text: `คุณดาวน์โหลดครบ ${quotaRes.data.max} เพลงแล้ว (เหลือ ${quotaRes.data.remaining} เพลง)`,
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        return;
      }

      // 2. บันทึกประวัติการดาวน์โหลดก่อน (สำคัญ!)
      await axios.post(
        `http://localhost:5000/api/songs/${song._id}/download`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. ดาวน์โหลดไฟล์จาก route ใหม่ที่มี authentication
      const response = await axios.get(
        `http://localhost:5000/api/songs/${song._id}/file`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 4. สร้าง URL และดาวน์โหลดไฟล์
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${song.title}.mp3`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 5. ส่ง event เพื่ออัพเดทหน้า Profile
      window.dispatchEvent(new Event("downloadSuccess"));

      Swal.fire({
        icon: "success",
        title: "ดาวน์โหลดสำเร็จ",
        text: `"${song.title}" ถูกดาวน์โหลดเรียบร้อยแล้ว 🎵`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (err) {
      console.error("Download error:", err);
      
      let errorMsg = "ไม่สามารถดาวน์โหลดเพลงได้";
      
      if (err.response?.status === 404) {
        errorMsg = "ไม่พบไฟล์เพลงบนเซิร์ฟเวอร์";
      } else if (err.response?.status === 403) {
        errorMsg = err.response.data.message || "โควต้าดาวน์โหลดเต็ม";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorMsg,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
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
        <audio
          ref={audioRef}
          src={`http://localhost:5000/${song.filePath}`}
          onEnded={() => setIsPlaying(false)}
        />
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