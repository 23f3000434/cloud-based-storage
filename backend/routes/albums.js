const express = require("express");
const supabase = require("../lib/supabase");
const authenticate = require("../middleware/auth");

const router = express.Router();

// Get all albums for user
router.get("/", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("albums")
      .select("*, images(id)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const albums = data.map((a) => ({
      ...a,
      image_count: a.images?.length || 0,
      images: undefined,
    }));

    res.json(albums);
  } catch (err) {
    console.error("Get albums error:", err);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

// Create album
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, description, is_public } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const { data, error } = await supabase
      .from("albums")
      .insert({
        user_id: req.user.id,
        title,
        description: description || "",
        is_public: is_public || false,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Create album error:", err);
    res.status(500).json({ error: "Failed to create album" });
  }
});

// Update album
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { title, description, is_public } = req.body;

    const { data, error } = await supabase
      .from("albums")
      .update({ title, description, is_public })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Update album error:", err);
    res.status(500).json({ error: "Failed to update album" });
  }
});

// Delete album
router.delete("/:id", authenticate, async (req, res) => {
  try {
    // Delete all images in album from storage first
    const { data: images } = await supabase
      .from("images")
      .select("storage_path")
      .eq("album_id", req.params.id)
      .eq("user_id", req.user.id);

    if (images && images.length > 0) {
      const paths = images.map((img) => img.storage_path);
      await supabase.storage.from("images").remove(paths);
    }

    // Delete images records
    await supabase
      .from("images")
      .delete()
      .eq("album_id", req.params.id)
      .eq("user_id", req.user.id);

    // Delete share links
    await supabase
      .from("share_links")
      .delete()
      .eq("album_id", req.params.id);

    // Delete album
    const { error } = await supabase
      .from("albums")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({ message: "Album deleted" });
  } catch (err) {
    console.error("Delete album error:", err);
    res.status(500).json({ error: "Failed to delete album" });
  }
});

// Get single album with images
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { data: album, error } = await supabase
      .from("albums")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    if (error || !album) {
      return res.status(404).json({ error: "Album not found" });
    }

    const { data: images } = await supabase
      .from("images")
      .select("*")
      .eq("album_id", req.params.id)
      .order("uploaded_at", { ascending: false });

    res.json({ ...album, images: images || [] });
  } catch (err) {
    console.error("Get album error:", err);
    res.status(500).json({ error: "Failed to fetch album" });
  }
});

module.exports = router;
