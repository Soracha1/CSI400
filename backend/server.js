import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB connection ---
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Music folder ---
const musicPath = path.join("uploads/music");
if (!fs.existsSync(musicPath)) fs.mkdirSync(musicPath, { recursive: true });

// --- Multer setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, musicPath),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// --- Mongoose Schema ---
const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  description: String,
  bpm: Number,
  key: String,
  mode: String,
  type: String,
  subtype: String,
  filePath: String,
  createdAt: { type: Date, default: Date.now },
});

const Song = mongoose.model("Song", songSchema);

// --- Upload song route ---
app.post("/api/upload", upload.single("music"), async (req, res) => {
  try {
    const { title, artist, description, bpm, key, mode, type, subtype } =
      req.body;
    const newSong = await Song.create({
      title,
      artist,
      description,
      bpm: Number(bpm),
      key,
      mode,
      type,
      subtype,
      filePath: req.file.path,
    });
    res.json(newSong);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Get all songs ---
app.get("/api/songs", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Serve music files ---
app.use("/uploads/music", express.static("uploads/music"));

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));