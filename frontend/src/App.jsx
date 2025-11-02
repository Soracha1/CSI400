import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import TrendingSounds from "./components/TrendingSounds";
import Footer from "./components/Footer";
import UploadSong from "./upload/uploads";
import Login from "./Login/Login";
import Rigister from "./Rigisters/Rigister";

function App() {
  return (
    <div>
      
      {/*<Navbar />*/}
      <Login />
       {/*<Rigister />*/}
      {/* <HeroSection />
      <TrendingSounds />
      <Footer /> */}
      {/* <UploadSong /> */}
    </div>
  );
}

export default App;
