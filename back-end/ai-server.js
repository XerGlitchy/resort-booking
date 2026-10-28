
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json({ limit: "20kb" }));
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Resort AI chatbot server is running." });
});

app.listen(PORT, () => {
  console.log(`AI chatbot server running at http://localhost:${PORT}`);
});
