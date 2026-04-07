const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const supabase = require("../lib/supabase");
const authenticate = require("../middleware/auth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
    }
  },
});

// Upload image
router.post("/upload", authenticate, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const { album_id } = req.body;
    if (!album_id) {
      return res.status(400).json({ error: "album_id is required" });
    }

    // Verify album belongs to user
    const { data: album } = await supabase
      .from("albums")
      .select("id")
      .eq("id", album_id)
      .eq("user_id", req.user.id)
      .single();

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    // Upload to Supabase Storage
    const ext = path.extname(req.file.originalname);
    const filename = `${req.user.id}/${album_id}/${uuidv4()}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filename);

    // Save to database
    const { data: image, error: dbError } = await supabase
      .from("images")
      .insert({
        user_id: req.user.id,
        album_id,
        filename: req.file.originalname,
        storage_path: filename,
        url: urlData.publicUrl,
        size_bytes: req.file.size,
        mime_type: req.file.mimetype,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json(image);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Delete image
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { data: image } = await supabase
      .from("images")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Remove from storage
    await supabase.storage.from("images").remove([image.storage_path]);

    // Remove from database
    const { error } = await supabase
      .from("images")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Image deleted" });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// Get all images for user
router.get("/", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("images")
      .select("*, albums(title)")
      .eq("user_id", req.user.id)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Get images error:", err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

module.exports = router;
