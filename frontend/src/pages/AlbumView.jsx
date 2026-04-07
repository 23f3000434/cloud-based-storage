import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

function AlbumView() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    fetchAlbum();
  }, [id]);

  const fetchAlbum = async () => {
    try {
      const { data } = await api.get(`/albums/${id}`);
      setAlbum(data);
    } catch (err) {
      console.error("Failed to fetch album:", err);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("album_id", id);
        await api.post("/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      fetchAlbum();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Max 10MB per image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteImage = async (imageId) => {
    try {
      await api.delete(`/images/${imageId}`);
      fetchAlbum();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const createShareLink = async () => {
    try {
      const { data } = await api.post("/share", {
        album_id: id,
        expires_in_hours: 24,
      });
      const frontendUrl = `${window.location.origin}/shared/${data.token}`;
      setShareLink(frontendUrl);
      navigator.clipboard.writeText(frontendUrl).catch(() => {});
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  if (!album) {
    return <div className="loading">Loading album...</div>;
  }

  return (
    <div className="album-view">
      <div className="album-view-header">
        <div>
          <Link to="/" className="back-link">Back to Albums</Link>
          <h2>{album.title}</h2>
          {album.description && <p className="album-desc">{album.description}</p>}
        </div>
        <div className="album-actions">
          <button className="btn btn-secondary" onClick={createShareLink}>
            Share Album
          </button>
          <label className="btn btn-primary upload-btn">
            {uploading ? "Uploading..." : "+ Upload Images"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              hidden
            />
          </label>
        </div>
      </div>

      {shareLink && (
        <div className="share-banner">
          <span>Share link (expires in 24h):</span>
          <code>{shareLink}</code>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => navigator.clipboard.writeText(shareLink)}
          >
            Copy
          </button>
          <button className="btn-close" onClick={() => setShareLink(null)}>&times;</button>
        </div>
      )}

      {album.images.length === 0 ? (
        <div className="empty-state">
          <p>No images yet. Upload some images to get started.</p>
        </div>
      ) : (
        <div className="image-grid">
          {album.images.map((img) => (
            <div key={img.id} className="image-card">
              <img
                src={img.url}
                alt={img.filename}
                onClick={() => setLightbox(img)}
                loading="lazy"
              />
              <div className="image-overlay">
                <span className="image-name">{img.filename}</span>
                <button
                  className="btn-delete-img"
                  onClick={() => deleteImage(img.id)}
                  title="Delete image"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox.url} alt={lightbox.filename} />
          <button className="lightbox-close" onClick={() => setLightbox(null)}>&times;</button>
        </div>
      )}
    </div>
  );
}

export default AlbumView;
