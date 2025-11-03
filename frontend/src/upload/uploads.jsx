import React, { useState } from "react";
import axios from "axios";
import "./upload.css";

const keyOptions = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const modeOptions = ["Major", "Minor", "None"];
const typeOptions = ["bass", "guitar", "drums", "vocals", "synth", "keys"];
const subtypeOptions = {
  bass: ["analog synth bass", "fingered bass", "sub bass"],
  guitar: ["acoustic guitar", "electric guitar"],
  drums: ["kicks", "snares", "claps"],
  vocals: ["singing", "spoken"],
  synth: ["lead", "pad", "fx"],
  keys: ["piano", "organ"],
};

function UploadSong() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("C");
  const [mode, setMode] = useState("None");
  const [type, setType] = useState(typeOptions[0]);
  const [subtype, setSubtype] = useState(subtypeOptions[typeOptions[0]][0]);
  const [file, setFile] = useState(null);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    setSubtype(subtypeOptions[newType]?.[0] || "");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("กรุณาเลือกไฟล์เพลงก่อน!");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("description", description);
    formData.append("bpm", bpm);
    formData.append("key", key);
    formData.append("mode", mode);
    formData.append("type", type);
    formData.append("subtype", subtype);
    formData.append("music", file);

    try {
      await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ อัปโหลดเพลงสำเร็จ!");
      setTitle("");
      setArtist("");
      setDescription("");
      setBpm("");
      setKey("C");
      setMode("None");
      setType(typeOptions[0]);
      setSubtype(subtypeOptions[typeOptions[0]][0]);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("❌ อัปโหลดไม่สำเร็จ");
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">UPLOAD SOUND</h2>

      <form className="upload-form" onSubmit={handleUpload}>
        <div className="upload-left">
          <label className="file-upload-box">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <span>📁 FILE</span>
          </label>
        </div>

        <div className="upload-right">
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select value={type} onChange={handleTypeChange}>
                {typeOptions.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Detail</label>
            <textarea
              placeholder="Detail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Subtype</label>
              <select
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
              >
                {(subtypeOptions[type] || []).map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>BPM</label>
              <input
                type="number"
                placeholder="BPM"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>KEY</label>
              <select value={key} onChange={(e) => setKey(e.target.value)}>
                {keyOptions.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="upload-btn" type="submit">
            UPLOAD
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadSong;
