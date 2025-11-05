import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import TrendingSounds from "./components/TrendingSounds";
import Footer from "./components/Footer";
import UploadSong from "./upload/uploads";
import Login from "./Login/Login";
import Rigister from "./Rigisters/Rigister";
 
import Profile from "./Profiles/Profile";

import SongList from "./home/SongList";
import EditProfile from "./editprofile/editprofile";


function App() {
  return (
    <div>
      

      <Navbar />

      {/* <TrendingSounds /> */}

      {/* <Footer /> */}

      {/* <Navbar /> */}
      {/* <Login /> */}

      {/* <Profile /> */}


       {/* <Login />  */}
       {/* <Rigister /> */}
      {/* <HeroSection /> */}
      {/* <EditProfile /> */}
    
       <UploadSong />
      {/* <SongList/> */}
  <Footer />

    </div>
  );
}

export default App;