import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import TrendingSounds from "./components/TrendingSounds";
import Footer from "./components/Footer";
import UploadSong from "./upload/uploads";
import Login from "./Login/Login";
import Rigister from "./Rigisters/Rigister";
import SongList from "./home/SongList";

function App() {
  return (
    <div>
      
      {/*<Navbar />*/}
       <Login /> 
       {/*<Rigister />*/}
      {/* <HeroSection /> */}
      {/* <TrendingSounds /> */}
      {/* <Footer /> */}
      {/* <UploadSong /> */}
      <SongList/>
    </div>
  );
}

export default App;
