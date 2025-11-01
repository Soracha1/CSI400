import React from "react";
import "./SoundCard.css";

function SoundCard({ sound }) {
  return (
    <div className="sound-card">
      <div className="sound-title">{sound.title}</div>
      <p className="artist">{sound.artist}</p>
      <div className="tags">
        {sound.tags.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
      <div className="bottom">
        <span>{sound.duration}</span>
        <button>▶</button>
      </div>
    </div>
  );
}
export default SoundCard;
