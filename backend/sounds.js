import express from "express";
import sounds from "../data/sounds.json" assert { type: "json" };

const router = express.Router();

router.get("/", (req, res) => {
  res.json(sounds);
});

router.get("/:id", (req, res) => {
  const sound = sounds.find(s => s.id === parseInt(req.params.id));
  sound ? res.json(sound) : res.status(404).json({ message: "Sound not found" });
});

export default router;
