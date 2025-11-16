import React, { useEffect, useState } from "react";
import SoundCard from "../../components/SoundCard";
import "./Profiledownload.css";

function Profiledownload() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDownloads = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      if (!user?._id) {
        console.log("No user ID found");
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:5000/api/user/${user._id}/downloads`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Downloads data:", data);
      setDownloads(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching downloads:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();

    // Listen for download events
    const handleDownloadSuccess = () => {
      console.log("Download detected, refreshing...");
      fetchDownloads();
    };

    window.addEventListener("downloadSuccess", handleDownloadSuccess);

    return () => {
      window.removeEventListener("downloadSuccess", handleDownloadSuccess);
    };
  }, []);

  if (loading) {
    return <div className="profile-download-container">Loading...</div>;
  }

  return (
    <div className="profile-download-container">
      {downloads.length === 0 ? (
        <p className="no-downloads">No downloads yet.</p>
      ) : (
        <div className="download-list">
          {downloads.map((item) => (
            <SoundCard 
              key={item._id} 
              sound={item.song} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Profiledownload;