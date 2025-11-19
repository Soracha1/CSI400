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
import { swaggerServe, swaggerSetup } from "./swagger.js";

dotenv.config();
const app = express();
const __dirname = path.resolve();

// ================= Middleware =================
app.use("/api-docs", swaggerServe, swaggerSetup);

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
/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: สมัครสมาชิก
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: สมัครสำเร็จ
 *       400:
 *         description: Email มีอยู่แล้ว
 *       500:
 *         description: เกิดข้อผิดพลาด
 */


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

// ================= Login Routes =================
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสําเร็จ
 *       400:
 *         description: อีเมลหรือรหัสผ่านไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาด
 */

// ================= Login Routes =================

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

// ================= User Routes =================
/**
 * @swagger
 * /auth/user:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ดึงข้อมูลผู้ใช้สําเร็จ
 *       401:
 *         description: ไม่พบข้อมูลผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
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
/** @swagger 
*paths:
  /auth/google:
    get:
      tags:
        - Auth (Google OAuth)
      summary: Login with Google
      description: Redirect user to Google OAuth login page.
      responses:
        "302":
          description: Redirect to Google OAuth login page

  /auth/google/callback:
    get:
      tags:
        - Auth (Google OAuth)
      summary: Google OAuth Callback URL
      description: Google redirects back to this URL after user grants permission.
      parameters:
        - in: query
          name: code
          schema:
            type: string
          required: false
          description: Authorization code returned from Google OAuth
      responses:
        "200":
          description: OAuth Login successful
          content:
            application/json:
              schema:
                type: object
                example:
                  _id: "65a1234bcf00112233445566"
                  username: "John Doe"
                  email: "johndoe@gmail.com"
                  googleId: "1122334455667788"
                  picture: "https://example.com/photo.jpg"
                  downloadCount: 0
                  uploadCount: 0
                  maxUpload: 3
                  maxDownload: 5
                  role: "user"
                  lastActivity: "2024-01-01T00:00:00.000Z"
        "302":
          description: Redirect after successful login
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error
*/

app.use(
  session({
    secret: process.env.JWT_SECRET || "mySecretKey",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());


// ================= Google OAuth =================
/** @swagger
paths:
  /auth/google:
    get:
      tags:
        - Auth (Google OAuth)
      summary: Redirect to Google OAuth
      description: Redirect users to Google for authentication.
      responses:
        "302":
          description: Redirecting to Google OAuth login page.

  /auth/google/callback:
    get:
      tags:
        - Auth (Google OAuth)
      summary: Google OAuth Callback
      description: >
        After user grants permission, Google redirects back to this URL.
        Passport GoogleStrategy will handle user creation (if not exists) and login.
      parameters:
        - in: query
          name: code
          schema:
            type: string
          required: false
          description: Authorization code returned from Google.
      responses:
        "200":
          description: Google OAuth login success
          content:
            application/json:
              schema:
                type: object
                example:
                  _id: "65a12abc9876543210ff1122"
                  username: "John Doe"
                  email: "johndoe@gmail.com"
                  googleId: "11223344556677"
                  picture: "https://example.com/photo.jpg"
                  downloadCount: 0
                  uploadCount: 0
                  maxUpload: 3
                  maxDownload: 5
                  role: "user"
                  lastActivity: "2025-01-01T00:00:00.000Z"
        "302":
          description: Redirect after successful authentication
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error
*/
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

// ================= Google OAuth Callback =================
/** @swagger
paths:
  /auth/google/callback:
    get:
      tags:
        - Auth (Google OAuth)
      summary: Google OAuth Callback
      description: >
        Google redirects back to this URL after login.  
        If authentication succeeds, a JWT token is generated and sent to the frontend via redirect URL.
      parameters:
        - in: query
          name: code
          schema:
            type: string
          required: false
          description: Authorization code returned by Google OAuth.
      responses:
        "302":
          description: Redirect to frontend with JWT token
          headers:
            Location:
              schema:
                type: string
                example: http://localhost:5173/?token=eyJhbGciOiJIUzI1NiIs...
              description: Redirect URL containing JWT token.
        "401":
          description: Google authentication failed (failureRedirect)
          content:
            text/html:
              schema:
                type: string
                example: Redirecting to /
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error

*/
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
/* @swagger
paths:
  /api/upload:
    post:
      tags:
        - Music
      summary: Upload a music file
      description: >
        Upload a music file with metadata.  
        Requires JWT authentication.  
        Users with role "user" are limited by maxUpload.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - music
                - title
              properties:
                music:
                  type: string
                  format: binary
                  description: Music file (audio)
                title:
                  type: string
                  example: My Song
                artist:
                  type: string
                  example: John Doe
                description:
                  type: string
                  example: This is a sample track.
                bpm:
                  type: number
                  example: 120
                key:
                  type: string
                  example: C
                mode:
                  type: string
                  example: Major
                type:
                  type: string
                  example: HipHop
                subtype:
                  type: string
                  example: BoomBap
                soundType:
                  type: string
                  example: DrumLoop
                tags:
                  type: string
                  description: JSON string array
                  example: "[\"trap\", \"808\", \"dark\"]"
      responses:
        "200":
          description: Upload success
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Upload success
                  song:
                    type: object
                    example:
                      _id: "65a12abc9876543210ff1122"
                      title: "My Song"
                      artist: "John Doe"
                      description: "Sample description"
                      bpm: 120
                      key: "C"
                      mode: "Major"
                      type: "HipHop"
                      subtype: "BoomBap"
                      tags: ["trap", "808", "dark"]
                      soundType: "DrumLoop"
                      filePath: "uploads/music/abc123.mp3"
                      user: "65a1234fc00112233445577"
                      createdAt: "2025-01-01T00:00:00.000Z"
        "400":
          description: No file uploaded
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: No file uploaded
        "403":
          description: Upload limit reached
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Upload limit reached
        "404":
          description: User not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: User not found
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error

*/
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
/* @swagger
paths:
  /api/songs:
    get:
      tags:
        - Songs
      summary: Get all songs
      description: Fetch all songs sorted by newest first.
      responses:
        "200":
          description: List of songs
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  example:
                    _id: "65a12abc9876543210ff1122"
                    title: "My Song"
                    artist: "John Doe"
                    likes: 10
                    downloads: 5
                    createdAt: "2025-01-01T00:00:00.000Z"
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error

  /api/songs/top-likes:
    get:
      tags:
        - Songs
      summary: Get top 5 songs by likes
      description: Returns songs sorted by like count (desc).
      responses:
        "200":
          description: Top liked songs
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  example:
                    _id: "65a12abc9876543210ff1122"
                    title: "Popular Song"
                    likes: 120
                    downloads: 30
                    createdAt: "2025-01-01T00:00:00.000Z"
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error

  /api/songs/top-downloads:
    get:
      tags:
        - Songs
      summary: Get top 5 songs by downloads
      description: Returns songs sorted by download count (desc).
      responses:
        "200":
          description: Top downloaded songs
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  example:
                    _id: "65a12abc9876543210ff1122"
                    title: "Hot Download"
                    likes: 22
                    downloads: 500
                    createdAt: "2025-01-01T00:00:00.000Z"
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error

  /api/songs/{id}:
    get:
      tags:
        - Songs
      summary: Get user info from token (Based on your current code)
      description: >
        This endpoint currently verifies a JWT token and returns the authenticated
        user's data, **NOT** the song data.  
        (If you want this to return song details, tell me to fix it!)
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: Song ID (currently unused in code)
      responses:
        "200":
          description: User data (from token)
          content:
            application/json:
              schema:
                type: object
                example:
                  _id: "65a1234abc00112233445577"
                  username: "JohnDoe"
                  email: "john@example.com"
                  role: "user"
        "401":
          description: No token provided
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: No token
        "404":
          description: User not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: User not found
        "500":
          description: Error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error
*/
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
/* @swagger
paths:
  /api/tags:
    get:
      tags:
        - Songs
      summary: Get unique tags from all songs
      description: >
        Returns a list of unique tags extracted from all songs.  
        Empty or whitespace tags are filtered out.
      responses:
        "200":
          description: List of unique tags
          content:
            application/json:
              schema:
                type: array
                items:
                  type: string
                example:
                  - trap
                  - hiphop
                  - edm
                  - 808
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Internal server error
*/

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

/* @swagger
paths:
  /api/songs/search:
    get:
      tags:
        - Songs
      summary: Search songs
      description: >
        Search songs by keyword or by tag.  
        - **q** → search in title, artist, description, tags (regex, case-insensitive)  
        - **tag** → filter songs by tag  
        If both are provided, **tag overrides q** (based on your code).
      parameters:
        - in: query
          name: q
          required: false
          schema:
            type: string
          description: Search keyword
          example: hiphop
        - in: query
          name: tag
          required: false
          schema:
            type: string
          description: Filter by exact tag
          example: trap
      responses:
        "200":
          description: List of matching songs
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  example:
                    _id: "65a12abc9876543210ff1122"
                    title: "Dark Trap Beat"
                    artist: "ProducerX"
                    description: "Hard trap beat with 808s."
                    bpm: 140
                    tags: ["trap", "808"]
                    likes: 10
                    downloads: 5
                    createdAt: "2025-01-01T00:00:00.000Z"
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Internal server error
*/
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
/* @swagger
paths:
  /api/songs/{id}/favorite:
    post:
      tags:
        - Favorites
      summary: Add song to user's favorites
      description: >
        Add a song to the authenticated user's favorites.  
        Also increments the song's like count by 1.
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: Song ID
      responses:
        "200":
          description: Song added to favorites
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Added to favorites
        "400":
          description: Song already in favorites
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Already in favorites
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error

    delete:
      tags:
        - Favorites
      summary: Remove song from user's favorites
      description: >
        Remove a song from the authenticated user's favorites.  
        Also decrements the song's like count by 1.
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: Song ID
      responses:
        "200":
          description: Song removed from favorites
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Removed from favorites
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error

  /api/user/{id}/favorites:
    get:
      tags:
        - Favorites
      summary: Get list of user's favorite songs
      description: >
        Returns all favorite songs of the user,  
        populated with song owner info (username, picture).
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: User ID
      responses:
        "200":
          description: List of favorite songs
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                example:
                  - _id: "65a12abc9876543210ff1122"
                    title: "Trap Beat"
                    artist: "ProducerX"
                    likes: 20
                    downloads: 8
                    user:
                      _id: "65a111222333"
                      username: "JohnDoe"
                      picture: "https://example.com/p.jpg"
        "404":
          description: User not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: User not found
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error
*/
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
/* @swagger
paths:
  /api/songs/{id}/download:
    post:
      tags:
        - Downloads
      summary: Record a song download
      description: >
        Record a download for the authenticated user.  
        Increments song's download count and user's downloadCount.  
        Emits a real-time notification.
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: Song ID
      responses:
        "200":
          description: Download recorded successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Download recorded successfully
                  song:
                    type: object
                  notification:
                    type: object
        "403":
          description: Download limit reached
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Download limit reached
        "404":
          description: User or song not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: User not found
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Internal server error

  /api/songs/{id}/file:
    get:
      tags:
        - Downloads
      summary: Download the actual song file
      description: >
        Send the MP3 file for the given song.  
        Requires authentication.
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: Song ID
      responses:
        "200":
          description: File download
          content:
            application/octet-stream:
              schema:
                type: string
                format: binary
        "404":
          description: Song or file not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  path:
                    type: string
        "500":
          description: Server error

  /api/users/download-quota:
    get:
      tags:
        - Downloads
      summary: Get current user's download quota
      description: >
        Returns information about the user's download quota including max downloads, current count, and remaining downloads.
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Download quota info
          content:
            application/json:
              schema:
                type: object
                properties:
                  allowed:
                    type: boolean
                  current:
                    type: integer
                  max:
                    type: integer
                  remaining:
                    type: integer
                  role:
                    type: string
        "404":
          description: User not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        "500":
          description: Server error

  /api/user/{id}/downloads:
    get:
      tags:
        - Downloads
      summary: Get user's download history
      description: >
        Returns all downloads (type: "download") notifications for the authenticated user.  
        User can only access their own downloads.
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: User ID
      responses:
        "200":
          description: List of download notifications
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
        "403":
          description: Forbidden
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Forbidden: You can only view your own downloads.
        "500":
          description: Server error

  /api/songs/{id}/check:
    get:
      tags:
        - Downloads
      summary: Check if song file exists
      description: >
        Check whether a song exists in DB and if the file exists on server.
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: Song ID
      responses:
        "200":
          description: File existence info
          content:
            application/json:
              schema:
                type: object
                properties:
                  exists:
                    type: boolean
                  song:
                    type: string
                  filePath:
                    type: string
                  fullPath:
                    type: string
                  message:
                    type: string
        "500":
          description: Server error

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

*/
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
/* @swagger
paths:
  /api/user/{id}/uploads:
    get:
      tags:
        - User
      summary: Get all uploads by a user
      description: Retrieve all songs uploaded by a specific user, sorted by creation date descending.
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: User ID
      responses:
        "200":
          description: List of user's uploaded songs
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    _id:
                      type: string
                    title:
                      type: string
                    artist:
                      type: string
                    description:
                      type: string
                    bpm:
                      type: number
                    key:
                      type: string
                    mode:
                      type: string
                    type:
                      type: string
                    subtype:
                      type: string
                    tags:
                      type: array
                      items:
                        type: string
                    soundType:
                      type: string
                    filePath:
                      type: string
                    user:
                      type: string
                    createdAt:
                      type: string
                      format: date-time
                    updatedAt:
                      type: string
                      format: date-time
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string

  /api/user/{id}/limits:
    get:
      tags:
        - User
      summary: Get user's upload/download limits
      description: Retrieve the current upload/download count and max limits of a specific user.
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: User ID
      responses:
        "200":
          description: User limits info
          content:
            application/json:
              schema:
                type: object
                properties:
                  uploadCount:
                    type: integer
                  downloadCount:
                    type: integer
                  maxUpload:
                    type: integer
                  maxDownload:
                    type: integer
        "404":
          description: User not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
*/
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
/* @swagger
paths:
  /api/user/{id}:
    put:
      tags:
        - User
      summary: Update user profile
      description: Update user profile information including username, email, bio, social media links, and avatar.
      security:
        - bearerAuth: []   # ใช้ JWT token
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: User ID to update
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                username:
                  type: string
                email:
                  type: string
                  format: email
                bio:
                  type: string
                tiktok:
                  type: string
                  description: TikTok profile URL
                instagram:
                  type: string
                  description: Instagram profile URL
                facebook:
                  type: string
                  description: Facebook profile URL
                avatar:
                  type: string
                  format: binary
                  description: New avatar image file
      responses:
        "200":
          description: Profile updated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  user:
                    type: object
                    properties:
                      _id:
                        type: string
                      username:
                        type: string
                      email:
                        type: string
                      bio:
                        type: string
                      tiktok:
                        type: string
                      instagram:
                        type: string
                      facebook:
                        type: string
                      avatar:
                        type: string
                        format: uri
                      picture:
                        type: string
                        format: uri
        "403":
          description: Forbidden – user cannot update another user's profile
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        "404":
          description: User not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  error:
                    type: string

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

*/
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
/* @swagger
paths:
  /api/notifications:
    get:
      tags:
        - Notifications
      summary: Get latest notifications
      description: Retrieve the latest 20 notifications, sorted by creation date.
      responses:
        "200":
          description: List of notifications
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    _id:
                      type: string
                    type:
                      type: string
                    message:
                      type: string
                    user:
                      type: object
                      properties:
                        _id:
                          type: string
                        username:
                          type: string
                        picture:
                          type: string
                    song:
                      type: object
                      properties:
                        _id:
                          type: string
                        title:
                          type: string
                        artist:
                          type: string
                    createdAt:
                      type: string
                      format: date-time
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string

    post:
      tags:
        - Notifications
      summary: Create a new notification
      description: Create a new notification and broadcast it via WebSocket (Socket.io).
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - type
                - message
                - userId
              properties:
                type:
                  type: string
                  description: Type of notification (e.g., upload, download)
                message:
                  type: string
                  description: Notification message
                userId:
                  type: string
                  description: ID of the user who triggered the notification
                songId:
                  type: string
                  description: (Optional) Associated song ID
      responses:
        "200":
          description: Notification created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  _id:
                    type: string
                  type:
                    type: string
                  message:
                    type: string
                  user:
                    type: string
                  song:
                    type: string
                  createdAt:
                    type: string
                    format: date-time
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
*/
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
/* @swagger
paths:
  /api/tags:
    get:
      tags:
        - Tags
      summary: Get all tags
      description: Retrieve all unique tags from songs. Empty or whitespace-only tags are filtered out.
      responses:
        "200":
          description: List of tags
          content:
            application/json:
              schema:
                type: array
                items:
                  type: string
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
*/
app.get("/api/tags", async (req, res) => {
  try {
    const tags = await Song.find().distinct("tags");
    res.json(tags.filter((t) => t && t.trim() !== ""));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= Admin Routes =================
/* @swagger
paths:
  /api/admin/users:
    get:
      tags:
        - Admin
      summary: Get all users
      description: Retrieve all users (passwords excluded). Requires admin privileges.
      security:
        - bearerAuth: []
      responses:
        "200":
          description: List of users
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    _id:
                      type: string
                    username:
                      type: string
                    email:
                      type: string
                    role:
                      type: string
        "401":
          description: Unauthorized
        "403":
          description: Forbidden (not admin)
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string

  /api/admin/users/{id}/role:
    put:
      tags:
        - Admin
      summary: Update user role
      description: Update the role of a user (user/admin). Requires admin privileges.
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          description: User ID
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                role:
                  type: string
                  enum: [user, admin]
      responses:
        "200":
          description: Role updated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  user:
                    type: object
                    properties:
                      _id:
                        type: string
                      username:
                        type: string
                      email:
                        type: string
                      role:
                        type: string
        "400":
          description: Invalid role
        "401":
          description: Unauthorized
        "403":
          description: Forbidden (not admin)
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
*/
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
/* @swagger
paths:
  /uploads/{filename}:
    get:
      tags:
        - Uploads
      summary: Access uploaded files
      description: >
        Serve static files from the `uploads` directory.
        CORS is enabled, so any origin can access files.
      parameters:
        - name: filename
          in: path
          description: Name of the uploaded file
          required: true
          schema:
            type: string
      responses:
        "200":
          description: File served successfully
          content:
            application/octet-stream:
              schema:
                type: string
                format: binary
        "404":
          description: File not found
        "500":
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
*/
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// ================= Socket.IO =================
/*@swagger
components:
  schemas:
    SocketEvent:
      type: object
      properties:
        type:
          type: string
          description: Type of event
        payload:
          type: object
          description: Event data

paths:
  /socket.io:
    get:
      summary: WebSocket / Socket.IO connection
      description: |
        Clients connect to this endpoint via Socket.IO.
        CORS allows connections from:
          - http://localhost:3000
          - http://localhost:5173
      responses:
        "101":
          description: Switching Protocols (WebSocket handshake)
  
webhooks:
  socketEvents:
    summary: Real-time Socket.IO events
    description: |
      Events emitted from server via Socket.IO:
        - "connection": Fired when a new client connects. Payload includes `socket.id`.
        - "disconnect": Fired when a client disconnects. Payload includes `socket.id`.
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SocketEvent'
      responses:
        '200':
          description: Event received successfully
*/
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
/* @swagger
paths:
  /api/users/download-quota:
    get:
      summary: Get current user's download quota
      security:
        - bearerAuth: []
      responses:
        '200':
          description: User quota
          content:
            application/json:
              schema:
                type: object
                properties:
                  allowed:
                    type: boolean
                  remaining:
                    type: integer
        '404':
          description: User not found

  /api/admin/users/{id}/reset-quota:
    put:
      summary: Reset a user's upload/download quota (Admin)
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Quota reset
        '404':
          description: User not found

  /api/admin/users/{id}:
    delete:
      summary: Delete a user (Admin)
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User deleted
        '404':
          description: User not found

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
*/
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
/* @swagger
paths:
  /api/admin/songs:
    get:
      summary: Get all songs (Admin only)
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of all songs
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Song'
        '500':
          description: Internal server error

components:
  schemas:
    Song:
      type: object
      properties:
        _id:
          type: string
        title:
          type: string
        artist:
          type: string
        description:
          type: string
        bpm:
          type: integer
        key:
          type: string
        mode:
          type: string
        type:
          type: string
        subtype:
          type: string
        tags:
          type: array
          items:
            type: string
        soundType:
          type: string
        filePath:
          type: string
        user:
          type: string
        likes:
          type: integer
        downloads:
          type: integer
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
*/
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
/* @swagger
openapi: 3.0.3
info:
  title: Music App Admin API
  version: 1.0.0
  description: API สำหรับจัดการเพลงโดย Admin

servers:
  - url: http://localhost:5000

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Song:
      type: object
      properties:
        _id:
          type: string
        title:
          type: string
        artist:
          type: string
        description:
          type: string
        bpm:
          type: integer
        key:
          type: string
        mode:
          type: string
        type:
          type: string
        subtype:
          type: string
        tags:
          type: array
          items:
            type: string
        soundType:
          type: string
        filePath:
          type: string
        likes:
          type: integer
        downloads:
          type: integer
        createdAt:
          type: string
        updatedAt:
          type: string

security:
  - BearerAuth: []

paths:
  /api/admin/songs:
    get:
      summary: ดึงเพลงทั้งหมด (Admin)
      security:
        - BearerAuth: []
      responses:
        '200':
          description: รายการเพลงทั้งหมด
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Song'
        '500':
          description: Internal server error

  /api/admin/songs/{id}:
    put:
      summary: อัปเดตเพลง (Admin)
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                title:
                  type: string
                artist:
                  type: string
                description:
                  type: string
                bpm:
                  type: integer
                key:
                  type: string
                mode:
                  type: string
                type:
                  type: string
                subtype:
                  type: string
                tags:
                  type: string
                  description: JSON string หรือ comma-separated
                soundType:
                  type: string
                music:
                  type: string
                  format: binary
      responses:
        '200':
          description: เพลงถูกอัปเดต
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  song:
                    $ref: '#/components/schemas/Song'
        '404':
          description: Song not found
        '500':
          description: Internal server error

    delete:
      summary: ลบเพลง (Admin)
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: เพลงถูกลบเรียบร้อย
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        '404':
          description: Song not found
        '500':
          description: Internal server error
*/
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
/* @swagger
openapi: 3.0.3
info:
  title: Music App Admin API
  version: 1.0.0
  description: API สำหรับ Admin Analytics

servers:
  - url: http://localhost:5000

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    UsersGrowth:
      type: object
      properties:
        date:
          type: string
          description: วันที่สร้างผู้ใช้ (YYYY-MM-DD)
        totalUsers:
          type: integer
          description: จำนวนผู้ใช้สะสมจนถึงวันนั้น

security:
  - BearerAuth: []

paths:
  /api/admin/analytics/users-growth:
    get:
      summary: ข้อมูลการเติบโตของผู้ใช้ (Admin)
      description: ดึงข้อมูลจำนวนผู้ใช้สะสมตามวันสำหรับกราฟ Analytics
      security:
        - BearerAuth: []
      responses:
        '200':
          description: รายการผู้ใช้สะสมตามวัน
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UsersGrowth'
        '500':
          description: Internal server error
*/
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
/* @swagger
openapi: 3.0.3
info:
  title: Music App Admin API
  version: 1.0.0
  description: API สำหรับ Admin Analytics

servers:
  - url: http://localhost:5000

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    UploadsDownloads:
      type: object
      properties:
        username:
          type: string
          description: ชื่อผู้ใช้
        uploads:
          type: integer
          description: จำนวนเพลงที่ผู้ใช้อัปโหลด
        downloads:
          type: integer
          description: จำนวนดาวน์โหลดของผู้ใช้

security:
  - BearerAuth: []

paths:
  /api/admin/analytics/uploads-downloads:
    get:
      summary: ข้อมูลการอัปโหลดและดาวน์โหลดของผู้ใช้ (Admin)
      description: ดึงข้อมูลจำนวนการอัปโหลดและดาวน์โหลดของแต่ละผู้ใช้
      security:
        - BearerAuth: []
      responses:
        '200':
          description: รายการผู้ใช้พร้อมจำนวนอัปโหลดและดาวน์โหลด
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UploadsDownloads'
        '500':
          description: Internal server error
*/
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
/* @swagger
openapi: 3.0.3
info:
  title: Music App API
  version: 1.0.0
  description: API สำหรับผู้ใช้และ Admin ของ Music App

servers:
  - url: http://localhost:5000

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    UploadsDownloads:
      type: object
      properties:
        username:
          type: string
        uploads:
          type: integer
        downloads:
          type: integer

    UserGrowth:
      type: object
      properties:
        date:
          type: string
        totalUsers:
          type: integer

    TopSong:
      type: object
      properties:
        title:
          type: string
        downloads:
          type: integer
        likes:
          type: integer

    RedeemCode:
      type: object
      properties:
        code:
          type: string
        plan:
          type: string
        used:
          type: boolean
        usedBy:
          type: object
          nullable: true
          properties:
            username:
              type: string
            email:
              type: string

    UserPlan:
      type: object
      properties:
        plan:
          type: string
        expire:
          type: string
          format: date-time
        remainingDays:
          type: integer

security:
  - BearerAuth: []

paths:
  /api/admin/analytics/uploads-downloads:
    get:
      summary: ข้อมูลการอัปโหลดและดาวน์โหลดของผู้ใช้ (Admin)
      security:
        - BearerAuth: []
      responses:
        '200':
          description: รายการผู้ใช้พร้อมจำนวนอัปโหลดและดาวน์โหลด
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UploadsDownloads'

  /api/admin/analytics/users-growth:
    get:
      summary: การเติบโตของผู้ใช้ตามวัน (Admin)
      security:
        - BearerAuth: []
      responses:
        '200':
          description: รายการผู้ใช้ตามวันสร้าง
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UserGrowth'

  /api/admin/analytics/top-songs:
    get:
      summary: ดึงเพลงยอดนิยมตามจำนวนดาวน์โหลด (Admin)
      security:
        - BearerAuth: []
      responses:
        '200':
          description: รายการเพลงยอดนิยม 5 เพลง
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TopSong'

  /api/admin/gencode:
    post:
      summary: สร้าง Redeem Code ใหม่ (Admin)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                plan:
                  type: string
                  description: ชื่อแพลน เช่น SOCOZY, SUPERCOZY, COZIEST
      responses:
        '200':
          description: Redeem Code ที่สร้างสำเร็จ
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  code:
                    type: string

  /api/redeem:
    post:
      summary: ใช้ Redeem Code สำหรับผู้ใช้
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                code:
                  type: string
                userId:
                  type: string
      responses:
        '200':
          description: ผลลัพธ์การ Redeem
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  message:
                    type: string

  /api/user/{id}/code:
    get:
      summary: ดูแผนปัจจุบันและวันหมดอายุของผู้ใช้
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: id
          schema:
            type: string
          required: true
      responses:
        '200':
          description: ข้อมูลแผนผู้ใช้
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserPlan'
        '403':
          description: Forbidden
        '404':
          description: User not found

  /api/admin/codes:
    get:
      summary: ดึงรายการ Redeem Codes ทั้งหมด (Admin)
      security:
        - BearerAuth: []
      responses:
        '200':
          description: รายการ Redeem Codes พร้อมผู้ใช้ที่ใช้
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/RedeemCode'
*/
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
  findCode.usedBy = user._id; // <-- สำคัญ
  await findCode.save();

  res.json({ success: true });
});

// GET โค้ดของ user ปัจจุบัน
app.get("/api/user/:id/code", verifyToken, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const remainingDays =
      user.planExpire && user.planExpire > now
        ? Math.ceil((user.planExpire - now) / (1000 * 60 * 60 * 24))
        : 0;

    res.json({
      plan: user.plan,
      expire: user.planExpire,
      remainingDays,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ประวัติ RedeemCode (เฉพาะ admin)
app.get("/api/admin/codes", verifyToken, isAdmin, async (req, res) => {
  try {
    // ดึงข้อมูลโค้ด พร้อม populate ผู้ใช้ที่ใช้โค้ด
    const codes = await RedeemCode.find()
      .sort({ createdAt: -1 })
      .populate("usedBy", "username email"); // เอาเฉพาะ username และ email

    res.json(codes);
  } catch (err) {
    console.error("❌ Error fetching redeem codes:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= Start Server =================
/**
 * @swagger
 * /hello:
 *   get:
 *     summary: Returns Hello World
 *     responses:
 *       200:
 *         description: Successful response
 */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
console.log("Swagger docs: http://localhost:5000/api-docs");
