import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

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
import AdminGenCode from "./admin/AdminGenCode";
import AdminCodeHistory from "./admin/AdminCodeHistory";

function AppWrapper() {
  const location = useLocation();
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
        }
      })
      .catch((err) => console.error("Auth failed:", err));
  }, []);

  // หน้าไหนให้แสดง search bar
  const showSearch =
    location.pathname === "/" ||
    location.pathname === "/dashboard" ||
    location.pathname === "/admin/songs";

  return (
    <>
      <Navbar setSearchTerm={setSearchTerm} showSearch={showSearch} />

      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <>
              <HeroSection setSearchTerm={setSearchTerm} />
              <SongList searchTerm={searchTerm} />
            </>
          }
        />

        {/* Admin */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route
          path="/admin/songs"
          element={
            <AdminSongs
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          }
        />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/generate-codes" element={<AdminGenCode />} />

        {/* Analytics */}
        <Route path="/admin/code-history" element={<AdminCodeHistory />} />
        <Route path="/analytics" element={<UserAnalytics />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Rigister />} />

        {/* User */}
        <Route path="/dashboard" element={<SongList searchTerm={searchTerm} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/upload" element={<UploadSong />} />
        <Route path="/premium" element={<Primium />} />
        <Route path="/song/:id" element={<SongDetail />} />

        {/* Help */}
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/qa" element={<QandA />} />
      </Routes>

      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
