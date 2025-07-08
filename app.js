import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import scoreRoutes from "./routes/score.js";
import placesRoutes from "./routes/places.js"; // ✅ add this line

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ✅ Register both routes under /api
app.use("/api", scoreRoutes);
app.use("/api", placesRoutes); // ✅ this line is required

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
