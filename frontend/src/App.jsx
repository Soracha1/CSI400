import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import TrendingSounds from "./components/TrendingSounds";
import Footer from "./components/Footer";
import UploadSong from "./upload/uploads";

function App() {
  return (
    <div>
      {/* <Navbar />
      <HeroSection />
      <TrendingSounds />
      <Footer /> */}
      <UploadSong />
    </div>
  );
}

export default App;
