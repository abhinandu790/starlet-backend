import express from "express";
import cors from "cors";
import router from "./routes/places";
const app = express();
const port = 5000;
app.use(cors());
app.use(router);
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.listen(port, () => {
console.log(`Server listening at port: ${port}`);
});