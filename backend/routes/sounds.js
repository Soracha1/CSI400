import express from "express";
import sounds from "../data/sounds.json" assert { type: "json" };

const router = express.Router();

// GET: ดึงข้อมูลเสียงทั้งหมด
router.get("/", (req, res) => {
  res.json(sounds);
});

export default router;
