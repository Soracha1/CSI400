import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 🧩 Components
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import TrendingSounds from "./components/TrendingSounds";
import Footer from "./components/Footer";
import UploadSong from "./upload/uploads";
import Login from "./Login/Login";
import Rigister from "./Rigisters/Rigister";
import Profile from "./Profiles/Profile";
import SongList from "./home/SongList";
import EditProfile from "./editprofile/editprofile";

function App() {
  // ✅ โหลดข้อมูลผู้ใช้จาก session (กรณีล็อกอินด้วย Google)
  useEffect(() => {
    fetch("http://localhost:5000/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => {
        if (data && data._id) {
          localStorage.setItem("user", JSON.stringify(data));
          console.log("✅ Logged in via Google:", data);
        }
      })
      .catch(() => {
        // ไม่ล็อกอินก็ไม่ต้องทำอะไร
      });
  }, []);

  return (
    <Router>
      <div>
        <Navbar />

        <Routes>
          {/* 🏠 หน้าแรก */}
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <TrendingSounds />
                <SongList />
              </>
            }
          />

          {/* 🔐 หน้าเข้าสู่ระบบ */}
          <Route path="/login" element={<Login />} />

          {/* 🆕 หน้าสมัครสมาชิก */}
          <Route path="/register" element={<Rigister />} />

          {/* 🎵 หน้าหลังล็อกอิน / dashboard */}
          <Route path="/dashboard" element={<SongList />} />

          {/* 👤 โปรไฟล์ */}
          <Route path="/profile" element={<Profile />} />

          {/* 📝 แก้ไขโปรไฟล์ */}
          <Route path="/edit-profile" element={<EditProfile />} />

          {/* ⬆️ อัปโหลดเพลง */}
          <Route path="/upload" element={<UploadSong />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
