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
import { Server } from "socket.io";
import http from "http";

dotenv.config();
const app = express();
const __dirname = path.resolve();

// ================= Socket.IO Setup (ต้องทำก่อน routes!) =================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);
  socket.on("disconnect", () =>
    console.log("❌ Socket disconnected:", socket.id)
  );
});

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
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ================= Models =================
const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["upload", "download"], required: true },
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  song: { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
  createdAt: { type: Date, default: Date.now },
});
const Notification = mongoose.model("Notification", notificationSchema);

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
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
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
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});
const Song = mongoose.model("Song", songSchema);

// ================= JWT Middleware =================
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
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

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    res.redirect(`http://localhost:5173/?token=${token}`);
  }
);

// ================= Song Upload =================
const uploadsDir = path.join(__dirname, "uploads/music");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

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
        user: req.userId,
      });

      user.uploadCount += 1;
      await user.save();

      // ส่ง notification realtime
      io.emit("notification", {
        type: "upload",
        message: `${user.username} uploaded ${song.title}`,
        user: user._id,
        song: song._id,
        createdAt: new Date(),
      });

      res.json({ message: "Upload success", song });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ================= Songs Routes =================
app.get("/api/songs", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/songs/top-likes", async (req, res) => {
  try {
    const songs = await Song.find().sort({ likes: -1 }).limit(5);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/songs/top-downloads", async (req, res) => {
  try {
    const songs = await Song.find().sort({ downloads: -1 }).limit(5);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/songs/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// ================= Favorites System =================
app.post("/api/songs/:id/favorite", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const songId = req.params.id;

    if (user.favorites?.includes(songId)) {
      return res.status(400).json({ message: "Already in favorites" });
    }

    await User.findByIdAndUpdate(req.userId, {
      $push: { favorites: songId }
    });

    await Song.findByIdAndUpdate(songId, {
      $inc: { likes: 1 }
    });

    res.json({ message: "Added to favorites" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/songs/:id/favorite", verifyToken, async (req, res) => {
  try {
    const songId = req.params.id;

    await User.findByIdAndUpdate(req.userId, {
      $pull: { favorites: songId }
    });

    await Song.findByIdAndUpdate(songId, {
      $inc: { likes: -1 }
    });

    res.json({ message: "Removed from favorites" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/user/:id/favorites", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: "favorites",
        populate: { path: "user", select: "username picture" }
      });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Download System =================
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

    // ส่ง notification realtime
    io.emit("notification", {
      type: "download",
      message: `${user.username} downloaded ${song.title}`,
      user: user._id,
      song: song._id,
      createdAt: new Date(),
    });

    res.json(song);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/user/:id/downloads", verifyToken, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: "Forbidden: You can only view your own downloads." });
    }

    const downloads = await Notification.find({
      user: req.params.id,
      type: "download",
    })
      .sort({ createdAt: -1 })
      .populate("song");

    res.json(downloads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= User Routes =================
app.get("/api/user/:id/uploads", async (req, res) => {
  try {
    const songs = await Song.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// ================= Notifications =================
app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "username picture")
      .populate("song", "title artist");
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/notifications", async (req, res) => {
  try {
    const { type, message, userId, songId } = req.body;
    const notif = await Notification.create({
      type,
      message,
      user: userId,
      song: songId,
    });

    io.emit("notification", notif);
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =========================
// TAGS ดึงแท็กทั้งหมด
// ================= Tags =================
app.get("/api/tags", async (req, res) => {
  try {
    const tags = await Song.find().distinct("tags");
    res.json(tags.filter((t) => t && t.trim() !== ""));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= Admin Routes =================
app.get("/api/admin/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/admin/users/:id/role", verifyToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ message: "Invalid role" });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    res.json({ message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Static Files =================
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);



// ================= Socket.IO =================
// สร้าง HTTP server
const server = http.createServer(app);

// สร้าง Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);
  socket.on("disconnect", () =>
    console.log("❌ Socket disconnected:", socket.id)
  );
});


// ================= Start Server =================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));