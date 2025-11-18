import React, { useState, useEffect } from "react";
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
import Help from "./help/Help";
import About from "./help/about/about";
import Contact from "./help/contact/contact";
import QandA from "./help/q&a/qqa";
import AdminPanel from "./admin/AdminPanel";
import AdminSongs from "./admin/AdminSongs";
import AdminAnalytics from "./admin/AdminAnalytics";
import UserAnalytics from "./analytic/UserAnalytics";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  // ตรวจสอบ token ตอน mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/auth/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => {
        if (data && data._id) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
          window.dispatchEvent(new Event("userLoggedIn"));
          console.log("✅ Logged in via token:", data);
        }
      })
      .catch((err) => console.error("❌ Auth failed:", err));
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
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
         <Route path="/qa" element={<QandA />} />
          <Route path="/help" element={<Help />} />
          <Route path="/profile/:id" element={<Profile />} />

          
        </Routes>

        <Footer />
      </div>
      <Navbar setSearchTerm={setSearchTerm} />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <HeroSection setSearchTerm={setSearchTerm} />
              <SongList searchTerm={searchTerm} />
            </>
          }
        />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/songs" element={<AdminSongs />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/analytics" element={<UserAnalytics />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Rigister />} />
        <Route path="/dashboard" element={<SongList />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/upload" element={<UploadSong />} />
        <Route path="/premium" element={<Primium />} />
        <Route path="/song/:id" element={<SongDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/qa" element={<QandA />} />
        <Route path="/help" element={<Help />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
