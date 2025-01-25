import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "./App";
import "./Gallery.css";

const DreamImage = ({ imageUrl }) => {
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    // Try HTTPS if HTTP fails, or vice versa
    if (!imgError && imageUrl) {
      setImgError(true);
      const newUrl = imageUrl.startsWith('https://')
        ? imageUrl.replace('https://', 'http://')
        : imageUrl.replace('http://', 'https://');
      const img = new Image();
      img.src = newUrl;
      img.onload = () => {
        const imgElement = document.querySelector(`img[data-original-src="${imageUrl}"]`);
        if (imgElement) {
          imgElement.src = newUrl;
        }
      };
    }
  };

  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt="Dream visualization"
      className="dream-image"
      onError={handleImageError}
      data-original-src={imageUrl}
    />
  );
};

const Gallery = () => {
  const { userId } = useContext(UserContext);
  const [dreams, setDreams] = useState([]);
  const [activeTab, setActiveTab] = useState("private"); // "private" or "public"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDreams();
  }, [userId, activeTab]);

  const loadDreams = async () => {
    if (!userId && activeTab === "private") return;

    try {
      setLoading(true);
      const endpoint = activeTab === "private" 
        ? `/api/get-user-dreams/${userId}`
        : "/api/public-dreams";
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch dreams");
      }
      
      const data = await response.json();
      setDreams(data);
    } catch (error) {
      console.error("Error loading dreams:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacy = async (dreamId) => {
    try {
      const response = await fetch(`/api/toggle-dream-privacy/${dreamId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle privacy");
      }

      // Refresh dreams after toggling
      loadDreams();
    } catch (error) {
      console.error("Error toggling privacy:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!userId) {
    return (
      <div className="gallery-container">
        <h2>Dream Gallery</h2>
        <p>Please log in to view your dreams.</p>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-tabs">
        <button
          className={`tab-button ${activeTab === "private" ? "active" : ""}`}
          onClick={() => setActiveTab("private")}
        >
          My Dreams
        </button>
        <button
          className={`tab-button ${activeTab === "public" ? "active" : ""}`}
          onClick={() => setActiveTab("public")}
        >
          Public Dreams
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading dreams...</div>
      ) : dreams.length === 0 ? (
        <p className="no-dreams">
          {activeTab === "private" 
            ? "You haven't logged any dreams yet." 
            : "No public dreams available."}
        </p>
      ) : (
        <div className="dreams-grid">
          {dreams.map((dream) => (
            <div key={dream._id} className="dream-card">
              <DreamImage imageUrl={dream.imageUrl} />
              <div className="dream-content">
                <p className="dream-text">{dream.text}</p>
                <p className="dream-date">{formatDate(dream.date)}</p>
                {activeTab === "private" && (
                  <button
                    className={`privacy-toggle ${dream.public ? "public" : "private"}`}
                    onClick={() => togglePrivacy(dream._id)}
                  >
                    {dream.public ? "Make Private" : "Make Public"}
                  </button>
                )}
                {activeTab === "public" && dream.userId !== userId && (
                  <p className="dream-author">Shared by another dreamer</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
