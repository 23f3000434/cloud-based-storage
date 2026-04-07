require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const albumRoutes = require("./routes/albums");
const imageRoutes = require("./routes/images");
const shareRoutes = require("./routes/share");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/share", shareRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CloudGallery API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
