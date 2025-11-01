import React from "react";
import "./HeroSection.css";
import hero from "../assets/01.png";

function HeroSection() {
  return (
    <div
      className="hero"
      style={{ backgroundImage: `url(${hero})` }}
    >
      <div className="hero-content">
        <h1>The easiest way to find the perfect audio sample</h1>
        <div className="search-bar">
          <input type="text" placeholder="hiphop" />
          <button>🔍</button>
        </div>
        <div className="tags">
          <span>hiphop</span>
          <span>trap</span>
          <span>lofi</span>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
