import React, { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import SongList from "./home/SongList";
import UploadSong from "./upload/uploads";
import Primium from "./primium/member";
import Profile from "./Profiles/Profile";



function App() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div>

      <Navbar />

      {/* ✅ ส่ง setSearchTerm ลงไป */}
      {/* <HeroSection setSearchTerm={setSearchTerm} /> */}

      {/* ✅ ส่ง searchTerm ลงไป
      <SongList searchTerm={searchTerm} /> */}

      <Primium />

      <Footer />
      {/* <UploadSong /> */}

       

      {/* <Profile /> */}



    </div>
  );
}

export default App;
