import React, { useState } from "react";
import axios from "axios";
import "./upload.css";

const keyOptions = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const modeOptions = ["Major", "Minor", "None"];
const typeOptions = [
  "bass",
  "guitar",
  "drums",
  "pad & atmosphere",
  "synthesizers",
  "keys",
  "vocals",
  "bowed string",
  "brass",
  "field recordings",
  "plucked string",
  "sound effects",
  "woodwinds",
];
const subtypeOptions = {
  bass: ["analog synth bass", "bass line", "digital synth bass", "distorted bass", "fingered bass", "picked bass", "slapped bass", "sub bass", "upright bass"],
  "bowed string": ["cello", "synth bowed string", "violin"],
  brass: ["flugel horn", "french horn", "synth brass", "trombone", "trumpet", "tuba"],
  drums: ["bells & mallets", "breakbeat", "claps", "closed hi-hats", "cowbell", "crashes", "found objects", "kicks", "latin & african", "mixed", "open hi-hats", "rides", "shaker", "snares", "synth drums", "tambourines", "toms", "wood blocks"],
  guitar: ["acoustic guitar", "electric guitar", "synth guitar"],
  keys: ["accordion", "clavichord", "clavinet", "harpsichord", "organ", "piano", "rhodes piano", "synth keys", "wurlitzer piano"],
  "plucked string": ["banjo", "harp", "mandolin", "other plucked", "sitar", "synth plucked string", "ukulele"],
  "sound effects": ["electronic", "explosions", "machines", "metal", "nature", "noise", "shots", "water", "other fx"],
  synthesizers: ["lead", "synth fx"],
  vocals: ["acappella", "singing", "spoken", "vocal fx"],
  woodwinds: ["bagpipes", "bassoon", "clarinet", "flute", "oboe", "ocarina", "piccolo", "recorder", "saxophone", "synth woodwind", "other winds"],
};

function UploadSong() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
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
    formData.append("genre", genre);
    formData.append("mood", mood);
    formData.append("tags", tags);
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
      setGenre("");
      setMood("");
      setTags("");
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
        {/* LEFT SIDE */}
        <div className="upload-left">
          <label className="file-upload-box">
            <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files[0])} />
            <span>{file ? file.name : "📁 เลือกไฟล์เพลง"}</span>
          </label>
        </div>

        {/* RIGHT SIDE */}
        <div className="upload-right">
          <div className="form-row">
            <div className="form-group">
              <label>ชื่อเพลง</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" required />
            </div>
            <div className="form-group">
              <label>ศิลปิน</label>
              <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist name" required />
            </div>
          </div>

          <div className="form-group">
            <label>รายละเอียด</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>แนวเพลง (Genre)</label>
              <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Pop, EDM" />
            </div>
            <div className="form-group">
              <label>อารมณ์เพลง (Mood)</label>
              <input type="text" value={mood} onChange={(e) => setMood(e.target.value)} placeholder="e.g. Chill, Happy" />
            </div>
          </div>

          <div className="form-group">
            <label>แท็ก (Tags)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="เช่น chill, night, loop" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>BPM</label>
              <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="BPM" />
            </div>
            <div className="form-group">
              <label>KEY</label>
              <select value={key} onChange={(e) => setKey(e.target.value)}>
                {keyOptions.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>MODE</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                {modeOptions.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ประเภท (Type)</label>
              <select value={type} onChange={handleTypeChange}>
                {typeOptions.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>ชนิดย่อย (Subtype)</label>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)}>
                {(subtypeOptions[type] || []).map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="upload-btn" type="submit">UPLOAD</button>
        </div>
      </form>
    </div>
  );
}

export default UploadSong;
