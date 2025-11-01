import React, { useEffect, useState } from "react";
import "./TrendingSounds.css";
import SoundCard from "./SoundCard";

function TrendingSounds() {
  const [sounds, setSounds] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/sounds")
      .then(res => res.json())
      .then(data => setSounds(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="trending">
      <h2>Trending Sounds</h2>
      <div className="sound-list">
        {sounds.map(s => (
          <SoundCard key={s.id} sound={s} />
        ))}
      </div>
    </div>
  );
}
export default TrendingSounds;
