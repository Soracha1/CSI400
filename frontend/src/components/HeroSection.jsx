import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HeroSection.css";
import hero from "../assets/01.png";

function HeroSection() {
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔹 โหลด tag จาก backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/tags") // ← ปรับตาม endpoint ของคุณ
      .then((res) => setTags(res.data))
      .catch((err) => console.error("Error fetching tags:", err));
  }, []);

  // 🔹 เมื่อกดปุ่มค้นหา
  const handleSearch = () => {
    if (searchTerm.trim() === "") return;
    window.location.href = `/songs?search=${encodeURIComponent(searchTerm)}`;
  };

  // 🔹 เมื่อกด tag
  const handleTagClick = (tag) => {
    window.location.href = `/songs?tag=${encodeURIComponent(tag)}`;
  };

  return (
    <div
      className="hero"
      style={{ backgroundImage: `url(${hero})` }}
    >
      <div className="overlay"></div>

      <div className="hero-content">
        <h1>The easiest way to find the perfect audio sample</h1>

        {/* 🔹 ช่องค้นหา */}
        <div className="search-bar">
         
          <input
            type="text"
            placeholder="Search your sound..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
           <button className="search-icon" onClick={handleSearch}>
            🔍
          </button>
        </div>

        {/* 🔹 Tag จาก backend */}
        <div className="tags">
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <span key={index} onClick={() => handleTagClick(tag.name || tag)}>
                #{tag.name || tag}
              </span>
            ))
          ) : (
            <p className="no-tags">Loading tags...</p>
          )}
        </div>
      </div>

      <div className="blue-line"></div>
    </div>
  );
}

export default HeroSection;
