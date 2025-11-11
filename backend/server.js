import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config();
const app = express();

// =============================
// ⚙️ Middleware & Config
// =============================
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// =============================
// 💾 MongoDB
// =============================
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// =============================
// 👤 USER SYSTEM
// =============================
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  googleId: String,
  picture: String, // ✅ เพิ่มรูปโปรไฟล์
});
const User = mongoose.model("User", userSchema);

// --- Register ---
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hash });
    res.json({ message: "Register success", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Login ---
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// 🔐 PASSPORT + GOOGLE AUTH
// =============================
app.use(
  session({
    secret: process.env.JWT_SECRET || "mySecretKey",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: profile.emails?.[0]?.value,
            googleId: profile.id,
            picture: profile.photos?.[0]?.value, // ✅ เก็บรูปโปรไฟล์ Google
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// --- Google Auth Routes ---
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:5173/"); // ✅ กลับหน้า React
  }
);

// --- ดึงข้อมูลผู้ใช้ปัจจุบัน (สำหรับ React ใช้ตอนโหลดเว็บ) ---
app.get("/auth/user", (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// =============================
// 🎵 SONG SYSTEM
// =============================
const musicPath = path.join("uploads/music");
if (!fs.existsSync(musicPath)) fs.mkdirSync(musicPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, musicPath),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

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
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/songs", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/uploads/music", express.static("uploads/music"));

// =============================
// 🚀 START SERVER
// =============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
