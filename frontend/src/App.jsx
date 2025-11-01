import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import TrendingSounds from "./components/TrendingSounds";
import Footer from "./components/Footer"

function App() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <TrendingSounds />
      <Footer/>
    </div>
  );
}

export default App;
