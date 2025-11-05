import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HeroSection.css";
import hero from "../assets/01.png";

function HeroSection() {
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/tags")
      .then((res) => setTags(res.data))
      .catch((err) => console.error("Error fetching tags:", err));
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim() === "") return;
    window.location.href = `/songs?search=${encodeURIComponent(searchTerm)}`;
  };

  const handleTagClick = (tag) => {
    window.location.href = `/songs?tag=${encodeURIComponent(tag)}`;
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
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
/>

        </div>

        <div className="tag-container">
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

      <div className="bottom-gradient"></div>
    </section>
  );
}

export default HeroSection;
