import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import TrendingSounds from "./components/TrendingSounds";
import Footer from "./components/Footer";
import UploadSong from "./upload/uploads";
import Login from "./Login/Login";
import Rigister from "./Rigisters/Rigister";
 HEAD
import Profile from "./Profiles/Profile";

import SongList from "./home/SongList";
import EditProfile from "./editprofile/editprofile";
489aaf50477b4233aac9a37342bc2b0284c16e41

function App() {
  return (
    <div>
      
 HEAD
      <Navbar />
      {/* <Login /> */}
      {/* <Rigister /> */}
      <Profile />
      {/* <HeroSection />

      <TrendingSounds />
      <Footer /> */}
      {/* <UploadSong /> */}

      {/*<Navbar />*/}
       {/*<Login />*/} 
       {/*<Rigister />*/}
      {/* <HeroSection /> */}
      <EditProfile />
      {/* <TrendingSounds /> */}
      {/* <Footer /> */}
       {/*<UploadSong />*/} 
      {/*<SongList/>*/}
 489aaf50477b4233aac9a37342bc2b0284c16e41
    </div>
  );
}

export default App;