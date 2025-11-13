// UploadSong.jsx
import React, { useState } from "react";
import axios from "axios";
import "./upload.css";

// ================== Constants ==================
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
  bass: [
    "analog synth bass",
    "bass line",
    "digital synth bass",
    "distorted bass",
    "fingered bass",
    "picked bass",
    "slapped bass",
    "sub bass",
    "upright bass",
  ],
  "bowed string": ["cello", "synth bowed string", "violin"],
  brass: [
    "flugel horn",
    "french horn",
    "synth brass",
    "trombone",
    "trumpet",
    "tuba",
  ],
  drums: [
    "bells & mallets",
    "breakbeat",
    "claps",
    "closed hi-hats",
    "cowbell",
    "crashes",
    "found objects",
    "kicks",
    "latin & african",
    "mixed",
    "open hi-hats",
    "rides",
    "shaker",
    "snares",
    "synth drums",
    "tambourines",
    "toms",
    "wood blocks",
  ],
  guitar: ["acoustic guitar", "electric guitar", "synth guitar"],
  keys: [
    "accordion",
    "clavichord",
    "clavinet",
    "harpsichord",
    "organ",
    "piano",
    "rhodes piano",
    "synth keys",
    "wurlitzer piano",
  ],
  "plucked string": [
    "banjo",
    "harp",
    "mandolin",
    "other plucked",
    "sitar",
    "synth plucked string",
    "ukulele",
  ],
  "sound effects": [
    "electronic",
    "explosions",
    "machines",
    "metal",
    "nature",
    "noise",
    "shots",
    "water",
    "other fx",
  ],
  synthesizers: ["lead", "synth fx"],
  vocals: ["acappella", "singing", "spoken", "vocal fx"],
  woodwinds: [
    "bagpipes",
    "bassoon",
    "clarinet",
    "flute",
    "oboe",
    "ocarina",
    "piccolo",
    "recorder",
    "saxophone",
    "synth woodwind",
    "other winds",
  ],
};

const keyOptions = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const modeOptions = ["Major", "Minor", "None"];
const tagOptions = [
  "Bittersweet",
  "Calm",
  "Chilled",
  "Confident",
  "Relaxed",
  "Romantic",
  "Seductive",
  "Serious",
  "Cool",
  "R B",
  "Flowing",
  "Groovy",
  "Electric Guitar",
  "Electronic Drums",
  "Percussion",
  "Piano",
  "Synth",
  "Male",
];

// ================== Component ==================
function UploadSong({ fetchLimits }) {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [form, setForm] = useState({
    title: "",
    artist: "",
    description: "",
    tags: [],
    bpm: "",
    key: "C",
    mode: "None",
    type: typeOptions[0],
    subtype: subtypeOptions[typeOptions[0]][0],
    soundType: "Loop",
  });

  const [file, setFile] = useState(null);

  // ================== Handlers ==================
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setForm({
      ...form,
      type: newType,
      subtype: subtypeOptions[newType][0] || "",
    });
  };

  const toggleTag = (tag) => {
    let updatedTags = [...form.tags];
    if (updatedTags.includes(tag))
      updatedTags = updatedTags.filter((t) => t !== tag);
    else updatedTags.push(tag);
    setForm({ ...form, tags: updatedTags });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user || !token) return alert("กรุณาเข้าสู่ระบบก่อนอัปโหลด");
    if (!file) return alert("กรุณาเลือกไฟล์เพลงก่อน!");
    if (form.tags.length < 4) return alert("กรุณาเลือก Tag อย่างน้อย 4 อัน");

    try {
      const formData = new FormData();
      Object.keys(form).forEach((k) =>
        formData.append(
          k,
          Array.isArray(form[k]) ? JSON.stringify(form[k]) : form[k]
        )
      );
      formData.append("music", file);

      const res = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data.message || "✅ อัปโหลดเพลงสำเร็จ!");
      if (fetchLimits) fetchLimits(user._id);

      // Reset form
      setForm({
        title: "",
        artist: "",
        description: "",
        tags: [],
        bpm: "",
        key: "C",
        mode: "None",
        type: typeOptions[0],
        subtype: subtypeOptions[typeOptions[0]][0],
        soundType: "Loop",
      });
      setFile(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "❌ อัปโหลดไม่สำเร็จ");
    }
  };

  // ================== JSX ==================
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
            <span>{file ? file.name : "📁 เลือกไฟล์เพลง"}</span>
          </label>
        </div>

        <div className="upload-right">
          <div className="form-row">
            <div className="form-group">
              <label>ชื่อเพลง</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>ศิลปิน</label>
              <input
                name="artist"
                value={form.artist}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>รายละเอียด</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>ประเภทซาวด์</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="soundType"
                  value="Loop"
                  checked={form.soundType === "Loop"}
                  onChange={handleChange}
                />{" "}
                Loop
              </label>
              <label>
                <input
                  type="radio"
                  name="soundType"
                  value="One Shot"
                  checked={form.soundType === "One Shot"}
                  onChange={handleChange}
                />{" "}
                One Shot
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>แท็ก (Tags) — เลือกขั้นต่ำ 4</label>
            <div className="tags-container">
              {tagOptions.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag-btn ${
                    form.tags.includes(tag) ? "active" : ""
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="tag-hint">เลือกแล้ว {form.tags.length} / ขั้นต่ำ 4</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>BPM</label>
              <input
                name="bpm"
                type="number"
                value={form.bpm}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>KEY</label>
              <select name="key" value={form.key} onChange={handleChange}>
                {keyOptions.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>MODE</label>
              <select name="mode" value={form.mode} onChange={handleChange}>
                {modeOptions.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ประเภท (Type)</label>
              <select value={form.type} onChange={handleTypeChange}>
                {typeOptions.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>ชนิดย่อย (Subtype)</label>
              <select
                name="subtype"
                value={form.subtype}
                onChange={handleChange}
              >
                {(subtypeOptions[form.type] || []).map((st) => (
                  <option key={st}>{st}</option>
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
