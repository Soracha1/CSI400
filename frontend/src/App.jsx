import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ Components
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import SongList from "./home/SongList";
import UploadSong from "./upload/uploads";
import Login from "./Login/Login";
import Rigister from "./Rigisters/Rigister";
import Profile from "./Profiles/Profile";
import EditProfile from "./editprofile/editprofile";
import Primium from "./primium/member";
import TrendingSounds from "./components/TrendingSounds";

function App() {
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ โหลดข้อมูลผู้ใช้จาก session (Google Login)
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
      .catch(() => {});
  }, []);

  return (
    <Router>
      <div>
        {/* ✅ Navbar บนทุกหน้า */}
        <Navbar setSearchTerm={setSearchTerm} />

        <Routes>
          {/* ✅ หน้าแรก */}
          <Route
            path="/"
            element={
              <>
                <HeroSection setSearchTerm={setSearchTerm} />
                <TrendingSounds />
                <SongList searchTerm={searchTerm} />
              </>
            }
          />

          {/* ✅ Login */}
          <Route path="/login" element={<Login />} />

          {/* ✅ Register */}
          <Route path="/register" element={<Rigister />} />

          {/* ✅ Dashboard (หน้าเพลงหลังล็อกอิน) */}
          <Route path="/dashboard" element={<SongList />} />

          {/* ✅ Profile */}
          <Route path="/profile" element={<Profile />} />

          {/* ✅ แก้ไขโปรไฟล์ */}
          <Route path="/edit-profile" element={<EditProfile />} />

          {/* ✅ อัปโหลดเพลง */}
          <Route path="/upload" element={<UploadSong />} />

          {/* ✅ Premium Page */}
          <Route path="/premium" element={<Primium />} />
        </Routes>

        {/* ✅ Footer แสดงทุกหน้า */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
