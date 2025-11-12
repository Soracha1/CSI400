// server.js (ES module style)
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
const __dirname = path.resolve(); // for ESM


// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// User model
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  googleId: String,
});
const User = mongoose.model("User", userSchema);

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hash });
    res.json({ message: "Register success", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
      expiresIn: "7d",
    });
    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Passport Google (optional)
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

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:3000/dashboard");
  }
);

// =========================
// SONG model + multer
// =========================
const uploadsDir = path.join(__dirname, "uploads", "music");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
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
  tags: [String], // ✅ เปลี่ยนเป็น Array
  soundType: String,
  filePath: String,
  likes: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Song = mongoose.model("Song", songSchema);

// Upload song
app.post("/api/upload", upload.single("music"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No music file uploaded" });

    // save relative path that matches static serving below
    const relativePath = path.join("uploads", "music", req.file.filename).replace(/\\/g, "/");

    const newSong = await Song.create({
      title: req.body.title || "",
      artist: req.body.artist || "",
      description: req.body.description || "",
      bpm: req.body.bpm ? Number(req.body.bpm) : undefined,
      key: req.body.key || "",
      mode: req.body.mode || "",
      type: req.body.type || "",
      subtype: req.body.subtype || "",
      tags: req.body.tags || "",
      soundType: req.body.soundType || "",
      filePath: relativePath,
    });

    res.json({ message: "Upload success", song: newSong });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all songs
app.get("/api/songs", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Like song (increment)
app.post("/api/songs/:id/like", async (req, res) => {
  try {
    const song = await Song.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download increment
app.post("/api/songs/:id/download", async (req, res) => {
  try {
    const song = await Song.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top lists
app.get("/api/songs/top-likes", async (req, res) => {
  try {
    const songs = await Song.find().sort({ likes: -1 }).limit(5);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/songs/top-downloads", async (req, res) => {
  try {
    const songs = await Song.find().sort({ downloads: -1 }).limit(5);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

// =========================
// TAGS ดึงแท็กทั้งหมด
app.get("/api/tags", async (req, res) => {
  try {
    const tags = await Song.find().distinct("tags");
    res.json(tags.filter((t) => t && t.trim() !== ""));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// =========================
// SEARCH endpoint
app.get("/api/songs/search", async (req, res) => {
  try {
    const { q, tag } = req.query;

    let query = {};

    if (q) {
      query = {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { artist: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { tags: { $regex: q, $options: "i" } },
        ],
      };
    }

    if (tag) {
      query = { tags: tag };
    }

    const songs = await Song.find(query);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get song by ID
app.get("/api/songs/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

