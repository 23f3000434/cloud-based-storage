import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

function SharedAlbum() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const res = await api.get(`/share/${token}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "This share link is invalid or expired.");
      }
    };
    fetchShared();
  }, [token]);

  if (error) {
    return (
      <div className="shared-page">
        <div className="shared-error">
          <h2>Link Unavailable</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="loading">Loading shared album...</div>;
  }

  return (
    <div className="shared-page">
      <div className="shared-header">
        <h2>{data.album.title}</h2>
        {data.album.description && <p>{data.album.description}</p>}
        <span className="shared-badge">Shared Album</span>
        {data.expires_at && (
          <span className="expires-info">
            Expires: {new Date(data.expires_at).toLocaleString()}
          </span>
        )}
      </div>

      {data.images.length === 0 ? (
        <div className="empty-state"><p>This album has no images.</p></div>
      ) : (
        <div className="image-grid">
          {data.images.map((img) => (
            <div key={img.id} className="image-card">
              <img
                src={img.url}
                alt={img.filename}
                onClick={() => setLightbox(img)}
                loading="lazy"
              />
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

export default SharedAlbum;
