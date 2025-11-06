import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HeroSection.css";
import hero from "../assets/01.png";

function HeroSection({ setSearchTerm }) {
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/songs")
      .then((res) => {
        const songs = res.data;

        // ✅ gather tags from type + subtype
        let tagList = [];
        songs.forEach(song => {
          if (song.type) tagList.push(song.type);
          if (song.subtype) tagList.push(song.subtype);
        });

        // ✅ remove duplicates + sort
        tagList = [...new Set(tagList)].sort((a, b) => a.localeCompare(b));

        setTags(tagList);
      })
      .catch((err) => console.error("Error fetching tags:", err));
  }, []);

  const handleSearch = () => {
    if (!input.trim()) return;
    setSearchTerm(input);
  };

  const handleTagClick = (tag) => {
    setSearchTerm(tag);
  };

  return (
    <section className="hero-section" style={{ backgroundImage: `url(${hero})` }}>
      <div className="hero-content">
        <h1>The easiest way to find the perfect audio sample</h1>

        <div className="search-box">
          <button className="search-btn" onClick={handleSearch}>🔍</button>
          <input
            className="search-input"
            type="search"
            placeholder="Search..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        {/* ✅ แสดง tag ทั้งหมดเรียงแล้ว */}
        <div className="tag-container">
          {tags.map((tag, index) => (
            <span key={index} onClick={() => handleTagClick(tag)}>
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="bottom-gradient"></div>
    </section>
  );
}

export default HeroSection;
