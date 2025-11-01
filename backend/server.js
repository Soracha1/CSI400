import express from "express";
import cors from "cors";
import soundsRoutes from "./routes/sounds.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/sounds", soundsRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
