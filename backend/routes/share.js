const express = require("express");
const { v4: uuidv4 } = require("uuid");
const supabase = require("../lib/supabase");
const authenticate = require("../middleware/auth");

const router = express.Router();

// Create share link for an album
router.post("/", authenticate, async (req, res) => {
  try {
    const { album_id, expires_in_hours } = req.body;

    if (!album_id) {
      return res.status(400).json({ error: "album_id is required" });
    }

    // Verify album belongs to user
    const { data: album } = await supabase
      .from("albums")
      .select("id, title")
      .eq("id", album_id)
      .eq("user_id", req.user.id)
      .single();

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    const token = uuidv4();
    let expires_at = null;
    if (expires_in_hours) {
      expires_at = new Date(
        Date.now() + expires_in_hours * 60 * 60 * 1000
      ).toISOString();
    }

    const { data, error } = await supabase
      .from("share_links")
      .insert({
        album_id,
        token,
        is_active: true,
        expires_at,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      ...data,
      share_url: `${req.protocol}://${req.get("host")}/api/share/${token}`,
    });
  } catch (err) {
    console.error("Create share link error:", err);
    res.status(500).json({ error: "Failed to create share link" });
  }
});

// Access shared album (public — no auth)
router.get("/:token", async (req, res) => {
  try {
    const { data: link, error } = await supabase
      .from("share_links")
      .select("*, albums(id, title, description)")
      .eq("token", req.params.token)
      .eq("is_active", true)
      .single();

    if (error || !link) {
      return res.status(404).json({ error: "Share link not found or expired" });
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ error: "This share link has expired" });
    }

    // Get album images
    const { data: images } = await supabase
      .from("images")
      .select("id, filename, url, uploaded_at")
      .eq("album_id", link.album_id)
      .order("uploaded_at", { ascending: false });

    res.json({
      album: link.albums,
      images: images || [],
      expires_at: link.expires_at,
    });
  } catch (err) {
    console.error("Access share error:", err);
    res.status(500).json({ error: "Failed to access shared album" });
  }
});

// Deactivate share link
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("share_links")
      .update({ is_active: false })
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Share link deactivated" });
  } catch (err) {
    console.error("Deactivate share error:", err);
    res.status(500).json({ error: "Failed to deactivate share link" });
  }
});

module.exports = router;
