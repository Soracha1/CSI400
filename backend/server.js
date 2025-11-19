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
import cron from "node-cron";
import RedeemCode from "./models/RedeemCode.js";

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

const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    googleId: String,
    picture: String,
    avatar: String,
    bio: String,
    // ✅ Social Media
    tiktok: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    // ฟิลด์เดิม
    downloadCount: { type: Number, default: 0 },
    uploadCount: { type: Number, default: 0 },
    maxUpload: { type: Number, default: 3 },
    maxDownload: { type: Number, default: 5 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastActivity: { type: Date, default: Date.now },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    plan: { type: String, default: "FREE" }, // FREE, SOCOZY, SUPERCOZY, COZIEST
    planStart: { type: Date, default: null }, // วันเริ่มแพ็คเกจ
    planExpire: { type: Date, default: null }, // วันหมดอายุแพ็คเกจ
  },
  { timestamps: true } // ✅ เพิ่ม timestamps
);
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

// ================= สร้างโฟลเดอร์ =================
const uploadsDir = path.join(__dirname, "uploads/music");
const avatarsDir = path.join(__dirname, "uploads/avatars");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created music directory");
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log("✅ Created avatars directory");
}

// ================= Multer Config for Music =================
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const musicUpload = multer({ storage: musicStorage });

// ================= Multer Config for Avatar =================
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${
      req.userId || Date.now()
    }-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("รองรับเฉพาะไฟล์รูปภาพเท่านั้น (jpeg, jpg, png, gif, webp)"));
  },
});

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
          // สร้าง user ใหม่พร้อมค่า default
          user = await User.create({
            username: profile.displayName,
            email: profile.emails?.[0]?.value,
            googleId: profile.id,
            picture: profile.photos?.[0]?.value,
            downloadCount: 0,
            uploadCount: 0,
            maxUpload: 3,
            maxDownload: 5,
            role: "user",
            lastActivity: new Date(),
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
    // สร้าง JWT token
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // redirect พร้อม token ให้ frontend
    res.redirect(`http://localhost:5173/?token=${token}`);
  }
);

// ================= Song Upload =================
app.post(
  "/api/upload",
  verifyToken,
  musicUpload.single("music"),
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

// =========================
// TAGS ดึงแท็กทั้งหมด
// ================= Tags =================
app.get("/api/tags", async (req, res) => {
  try {
    const tags = await Song.find().distinct("tags");
    res.json(tags.filter((t) => t && t.trim() !== ""));
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
      $push: { favorites: songId },
    });

    await Song.findByIdAndUpdate(songId, {
      $inc: { likes: 1 },
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
      $pull: { favorites: songId },
    });

    await Song.findByIdAndUpdate(songId, {
      $inc: { likes: -1 },
    });

    res.json({ message: "Removed from favorites" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/user/:id/favorites", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: "favorites",
      populate: { path: "user", select: "username picture" },
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
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "user" && user.downloadCount >= user.maxDownload)
      return res.status(403).json({ message: "Download limit reached" });

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!song) return res.status(404).json({ message: "Song not found" });

    user.downloadCount += 1;
    await user.save();

    const notification = await Notification.create({
      type: "download",
      message: `${user.username} downloaded ${song.title}`,
      user: user._id,
      song: song._id,
    });

    io.emit("notification", notification);

    res.json({
      message: "Download recorded successfully",
      song,
      notification,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/songs/:id/file", verifyToken, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const filePath = path.join(__dirname, song.filePath);

    if (!fs.existsSync(filePath)) {
      console.error("❌ File not found:", filePath);
      return res.status(404).json({
        message: "File not found on server",
        path: song.filePath,
      });
    }

    console.log("✅ Sending file:", filePath);

    res.download(filePath, `${song.title}.mp3`, (err) => {
      if (err) {
        console.error("❌ Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error downloading file" });
        }
      }
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/users/download-quota", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowed =
      user.role === "admin" || user.downloadCount < user.maxDownload;

    res.json({
      allowed,
      current: user.downloadCount,
      max: user.maxDownload,
      remaining: Math.max(0, user.maxDownload - user.downloadCount),
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/user/:id/downloads", verifyToken, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only view your own downloads." });
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

app.get("/api/songs/:id/check", verifyToken, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.json({ exists: false, message: "Song not found in DB" });
    }

    const filePath = path.join(__dirname, song.filePath);
    const fileExists = fs.existsSync(filePath);

    res.json({
      exists: fileExists,
      song: song.title,
      filePath: song.filePath,
      fullPath: filePath,
      message: fileExists ? "File exists ✅" : "File not found ❌",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= User Routes =================
app.get("/api/user/:id/uploads", async (req, res) => {
  try {
    const songs = await Song.find({ user: req.params.id }).sort({
      createdAt: -1,
    });
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

// ================= Update User Profile ✅ อัปเดตให้รองรับ Social Media =================
app.put(
  "/api/user/:id",
  verifyToken,
  avatarUpload.single("avatar"),
  async (req, res) => {
    try {
      console.log("📝 Update request received for user:", req.params.id);
      console.log("📋 Body:", req.body);
      console.log("📷 File:", req.file);

      // ตรวจสอบว่าเป็นเจ้าของ profile หรือไม่
      if (req.userId !== req.params.id) {
        return res
          .status(403)
          .json({ message: "คุณไม่มีสิทธิ์แก้ไขโปรไฟล์นี้" });
      }

      const { username, email, bio, tiktok, instagram, facebook } = req.body;

      // ✅ ข้อมูลที่จะอัพเดท (เพิ่ม Social Media)
      const updateData = {
        username,
        email,
        bio: bio || "",
        tiktok: tiktok || "",
        instagram: instagram || "",
        facebook: facebook || "",
      };

      // ถ้ามีการอัพโหลดรูปใหม่
      if (req.file) {
        updateData.avatar = `http://localhost:5000/uploads/avatars/${req.file.filename}`;
        updateData.picture = updateData.avatar; // ให้ picture เป็นค่าเดียวกับ avatar
        console.log("📷 New avatar path:", updateData.avatar);

        // ลบรูปเก่า (ถ้ามี)
        const oldUser = await User.findById(req.params.id);
        if (oldUser.avatar && oldUser.avatar.includes("uploads/avatars")) {
          const oldPath = path.join(
            __dirname,
            oldUser.avatar.replace("http://localhost:5000/", "")
          );
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log("🗑️ Old avatar deleted");
          }
        }
      }

      // อัพเดทข้อมูล
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้" });
      }

      console.log("✅ Profile updated successfully:", updatedUser.username);
      console.log("🌐 Social Media updated:", {
        tiktok: updatedUser.tiktok,
        instagram: updatedUser.instagram,
        facebook: updatedUser.facebook,
      });

      res.json({
        message: "อัพเดทโปรไฟล์สำเร็จ",
        user: updatedUser,
      });
    } catch (err) {
      console.error("❌ Update profile error:", err);
      res.status(500).json({
        message: "เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์",
        error: err.message,
      });
    }
  }
);

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

// ================= User Download Quota =================
app.get("/api/users/download-quota", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowed =
      user.role === "admin" || user.downloadCount < user.maxDownload;

    res.json({ allowed, remaining: user.maxDownload - user.downloadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(
  "/api/admin/users/:id/reset-quota",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.uploadCount = 0;
      user.downloadCount = 0;
      await user.save();

      res.json({ message: "Quota reset", user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.delete("/api/admin/users/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Admin Songs =================
// Get all songs (Admin)
app.get("/api/admin/songs", verifyToken, isAdmin, async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update song (Admin)
// ================= Admin Update Song =================
// ================= Admin Update Song =================
app.put(
  "/api/admin/songs/:id",
  verifyToken,
  isAdmin,
  musicUpload.single("music"), // <-- เปลี่ยนตรงนี้
  async (req, res) => {
    try {
      const song = await Song.findById(req.params.id);
      if (!song) return res.status(404).json({ message: "Song not found" });

      // อัปเดตฟิลด์ต่างๆ
      const fields = [
        "title",
        "artist",
        "description",
        "bpm",
        "key",
        "mode",
        "type",
        "subtype",
        "tags",
        "soundType",
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          // แปลง tags ที่ส่งเป็น JSON string กลับเป็น array
          if (field === "tags" && typeof req.body[field] === "string") {
            try {
              song[field] = JSON.parse(req.body[field]);
            } catch {
              song[field] = req.body[field]
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t);
            }
          } else if (field === "bpm") {
            song[field] = Number(req.body[field]);
          } else {
            song[field] = req.body[field];
          }
        }
      });

      // ถ้ามีไฟล์ใหม่ ให้อัปเดต filePath และลบไฟล์เก่า
      if (req.file) {
        if (
          song.filePath &&
          fs.existsSync(path.join(__dirname, song.filePath))
        ) {
          fs.unlinkSync(path.join(__dirname, song.filePath));
        }
        song.filePath = `uploads/music/${req.file.filename}`;
      }

      await song.save();
      res.json({ message: "Song updated", song });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

// Delete song (Admin)
app.delete("/api/admin/songs/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    // ลบไฟล์เพลง
    if (song.filePath && fs.existsSync(path.join(__dirname, song.filePath))) {
      fs.unlinkSync(path.join(__dirname, song.filePath));
    }

    await song.deleteOne();
    res.json({ message: "Song deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Admin: Users Growth =================
app.get(
  "/api/admin/analytics/users-growth",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: 1 });
      const data = users.map((u, idx) => ({
        date: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "N/A",
        totalUsers: idx + 1,
      }));
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ================= Admin: Upload/Download =================
app.get(
  "/api/admin/analytics/uploads-downloads",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await User.find();
      const data = users.map((u) => ({
        username: u.username || "Unknown",
        uploads: u.uploadCount || 0,
        downloads: u.downloadCount || 0,
      }));
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ================= Admin: Top Songs =================
app.get(
  "/api/admin/analytics/top-songs",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const songs = await Song.find().sort({ downloads: -1 }).limit(5);
      const data = songs.map((s) => ({
        title: s.title || "Untitled",
        downloads: s.downloads || 0,
        likes: s.likes || 0,
      }));
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

app.post("/api/admin/gencode", async (req, res) => {
  const { plan } = req.body;
  const txt = plan.toUpperCase().replace(" ", "");

  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `${txt}-${random}`;

  await RedeemCode.create({ code, plan });

  res.json({ success: true, code });
});

app.post("/api/redeem", async (req, res) => {
  const { code, userId } = req.body;

  const findCode = await RedeemCode.findOne({ code });

  if (!findCode) return res.json({ success: false, message: "โค้ดไม่ถูกต้อง" });
  if (findCode.used)
    return res.json({ success: false, message: "โค้ดถูกใช้แล้ว" });

  const user = await User.findById(userId);
  if (!user) return res.json({ success: false, message: "ไม่พบผู้ใช้" });

  let upload = 0,
    download = 0;

  if (findCode.plan === "SOCOZY") {
    upload = 100;
    download = 300;
  }
  if (findCode.plan === "SUPERCOZY") {
    upload = 200;
    download = 600;
  }
  if (findCode.plan === "COZIEST") {
    upload = Infinity;
    download = Infinity;
  }

  const now = new Date();
  const expire = new Date(now);
  expire.setDate(expire.getDate() + 30);

  user.maxUpload = upload;
  user.maxDownload = download;
  user.plan = findCode.plan;
  user.planStart = now;
  user.planExpire = expire;

  await user.save();

  findCode.used = true;
  await findCode.save();

  res.json({ success: true });
});

cron.schedule("0 0 * * *", async () => {
  const today = new Date();

  // หา user ที่แพ็คเกจหมดอายุแล้ว
  const expiredUsers = await User.find({
    planExpire: { $lte: today },
    plan: { $ne: "FREE" },
  });

  for (const u of expiredUsers) {
    // รีเซ็ตกลับเป็น FREE
    u.plan = "FREE";
    u.maxUpload = 3; // free default
    u.maxDownload = 5; // free default
    u.planStart = null;
    u.planExpire = null;

    await u.save();
  }

  console.log(`⏳ Reset expired plans: ${expiredUsers.length}`);
});

// ================= Start Server =================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
