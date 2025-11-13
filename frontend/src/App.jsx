import React, { useState, useEffect } from "react"; // ✅ เพิ่ม useEffect
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import SongList from "./home/SongList";
import SongDetail from "./home/SongDetail";
import UploadSong from "./upload/uploads";
import Login from "./Login/Login";
import Rigister from "./Rigisters/Rigister";
import Profile from "./Profiles/Profile";
import EditProfile from "./editprofile/editprofile";
import Primium from "./primium/member";
import TrendingSounds from "./components/TrendingSounds";

function App() {
  const [searchTerm, setSearchTerm] = useState("");

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
        <Navbar setSearchTerm={setSearchTerm} />

        <Routes>
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Rigister />} />
          <Route path="/dashboard" element={<SongList />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/upload" element={<UploadSong />} />
          <Route path="/premium" element={<Primium />} />
          <Route path="/song/:id" element={<SongDetail />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
