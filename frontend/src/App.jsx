// App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import SongList from "./home/SongList";
import SongDetail from "./home/SongDetail";
import UploadSong from "./upload/uploads";
import Primium from "./primium/member";
import Profile from "./Profiles/Profile";

function App() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* หน้าแรก */}
        <Route
          path="/"
          element={
            <>
              <HeroSection setSearchTerm={setSearchTerm} />
              <SongList searchTerm={searchTerm} />
              <Footer />
            </>
          }
        />
        {/* หน้าเพลงแต่ละเพลง */}
        <Route path="/song/:id" element={<SongDetail />} />
        {/* ตัวอย่างหน้าอื่น ๆ */}
        <Route path="/upload" element={<UploadSong />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/primium" element={<Primium />} />
      </Routes>
    </Router>
  );
}

export default App;
