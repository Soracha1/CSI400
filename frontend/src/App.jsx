import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import TrendingSounds from "./components/TrendingSounds";
import Footer from "./components/Footer";
import UploadSong from "./upload/uploads";
import Rigister from "./Rigisters/Rigister";

function App() {
  return (
    <div>
      
      <Navbar />
      <Rigister />
      {/* <HeroSection />
      <TrendingSounds />
      <Footer /> */}
      {/* <UploadSong /> */}
    </div>
  );
}

export default App;
