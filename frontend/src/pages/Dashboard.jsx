import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Dashboard() {
  const [albums, setAlbums] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const { data } = await api.get("/albums");
      setAlbums(data);
    } catch (err) {
      console.error("Failed to fetch albums:", err);
    } finally {
      setLoading(false);
    }
  };

  const createAlbum = async (e) => {
    e.preventDefault();
    try {
      await api.post("/albums", { title, description });
      setTitle("");
      setDescription("");
      setShowCreate(false);
      fetchAlbums();
    } catch (err) {
      console.error("Failed to create album:", err);
    }
  };

  const deleteAlbum = async (id) => {
    if (!window.confirm("Delete this album and all its images?")) return;
    try {
      await api.delete(`/albums/${id}`);
      fetchAlbums();
    } catch (err) {
      console.error("Failed to delete album:", err);
    }
  };

  if (loading) {
    return <div className="loading">Loading albums...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Albums</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ New Album"}
        </button>
      </div>

      {showCreate && (
        <form className="create-form" onSubmit={createAlbum}>
          <input
            type="text"
            placeholder="Album title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Create Album</button>
        </form>
      )}

      {albums.length === 0 ? (
        <div className="empty-state">
          <p>No albums yet. Create your first album to start uploading images.</p>
        </div>
      ) : (
        <div className="albums-grid">
          {albums.map((album) => (
            <div key={album.id} className="album-card">
              <Link to={`/album/${album.id}`} className="album-link">
                <div className="album-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <h3>{album.title}</h3>
                {album.description && <p className="album-desc">{album.description}</p>}
                <span className="album-count">
                  {album.image_count} image{album.image_count !== 1 ? "s" : ""}
                </span>
              </Link>
              <button
                className="btn-delete"
                onClick={() => deleteAlbum(album.id)}
                title="Delete album"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
