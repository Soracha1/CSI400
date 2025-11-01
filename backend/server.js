import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- เชื่อม MongoDB ---
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log(err));

// --- กำหนด folder เก็บเพลง ---
const musicPath = path.join("uploads/music");
if (!fs.existsSync(musicPath)) fs.mkdirSync(musicPath, { recursive: true });

// --- ตั้งค่า multer ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, musicPath),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// --- สร้าง model เพลง ---
import mongoose from "mongoose";
const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  filePath: String,
  createdAt: { type: Date, default: Date.now },
});
const Song = mongoose.model("Song", songSchema);

// --- Route อัปโหลดเพลง ---
app.post("/api/upload", upload.single("music"), async (req, res) => {
  try {
    const { title, artist } = req.body;
    const newSong = await Song.create({
      title,
      artist,
      filePath: req.file.path,
    });
    res.json(newSong);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Route ดึงเพลงทั้งหมด ---
app.get("/api/songs", async (req, res) => {
  const songs = await Song.find().sort({ createdAt: -1 });
  res.json(songs);
});

// --- Route เล่นเพลง ---
app.use("/music", express.static(musicPath));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
