// server.js (ESM)
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
const __dirname = path.resolve();

// ================= Middleware =================
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= MongoDB =================

// MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ================= Models =================
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  googleId: String,
  picture: String,
  downloadCount: { type: Number, default: 0 },
  uploadCount: { type: Number, default: 0 },
  maxUpload: { type: Number, default: 3 },
  maxDownload: { type: Number, default: 5 },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  lastActivity: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  description: String,
  bpm: Number,
  key: String,
  mode: String,
  type: String,
  subtype: String,
  tags: [String],
  soundType: String,
  filePath: String,
  likes: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const Song = mongoose.model("Song", songSchema);

// ================= JWT Middleware =================
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: "No token" });

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  next();
};

// ================= Auth Routes =================
// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hash });
    res.json({ message: "Register success", user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Google OAuth =================
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
            picture: profile.photos?.[0]?.value,
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) =>
  done(null, await User.findById(id))
);

// Google routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    // ส่ง JWT กลับ frontend แทน redirect ปกติ
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    res.redirect(`http://localhost:5173/?token=${token}`);
  }
);

// ================= Song System =================
const uploadsDir = path.join(__dirname, "uploads/music");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Upload song
app.post(
  "/api/upload",
  verifyToken,
  upload.single("music"),
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.role === "user" && user.uploadCount >= user.maxUpload)
        return res.status(403).json({ message: "Upload limit reached" });

      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const tags =
        typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : [];
      const song = await Song.create({
        title: req.body.title,
        artist: req.body.artist,
        description: req.body.description,
        bpm: Number(req.body.bpm) || 0,
        key: req.body.key || "",
        mode: req.body.mode || "",
        type: req.body.type || "",
        subtype: req.body.subtype || "",
        tags,
        soundType: req.body.soundType || "",
        filePath: `uploads/music/${req.file.filename}`,
      });

      user.uploadCount += 1;
      await user.save();

      res.json({ message: "Upload success", song });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Like & Download
app.post("/api/songs/:id/like", verifyToken, async (req, res) => {
  const song = await Song.findByIdAndUpdate(
    req.params.id,
    { $inc: { likes: 1 } },
    { new: true }
  );
  res.json(song);
});

app.post("/api/songs/:id/download", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role === "user" && user.downloadCount >= user.maxDownload)
      return res.status(403).json({ message: "Download limit reached" });

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    user.downloadCount += 1;
    await user.save();

    res.json(song);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get songs
app.get("/api/songs", async (req, res) => {
  const songs = await Song.find().sort({ createdAt: -1 });
  res.json(songs);
});

app.get("/api/songs/top-likes", async (req, res) => {
  const songs = await Song.find().sort({ likes: -1 }).limit(5);
  res.json(songs);
});

app.get("/api/songs/top-downloads", async (req, res) => {
  const songs = await Song.find().sort({ downloads: -1 }).limit(5);
  res.json(songs);
});

// Admin: view & update role
app.get("/api/admin/users", verifyToken, isAdmin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

app.put("/api/admin/users/:id/role", verifyToken, isAdmin, async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role))
    return res.status(400).json({ message: "Invalid role" });
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select("-password");
  res.json({ message: "Role updated", user });
});

// ================= User Limits =================
app.get("/api/user/:id/limits", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "uploadCount downloadCount maxUpload maxDownload"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Current User Info =================
app.get("/auth/user", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Start Server =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


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

// อนุญาต frontend ทุก origin ที่ต้องการ
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"], // frontend
    credentials: true,
  })
);

// Serve static files พร้อม header CORS
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // อนุญาตทุกโดเมน
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);
