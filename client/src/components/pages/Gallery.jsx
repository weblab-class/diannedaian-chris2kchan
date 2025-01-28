import React, { useState, useEffect } from "react";
import { get } from "../../utilities";
import PublicPost from "../modules/PublicPost";
import StarryBackground from "../modules/StarryBackground";
import "./Gallery.css";

const Gallery = () => {
  const [dreams, setDreams] = useState([]);
  const [selectedDream, setSelectedDream] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDreams();
  }, []);

  const loadDreams = async () => {
    try {
      const response = await get("/api/public-dreams");
      setDreams(response);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dreams:", error);
      setLoading(false);
    }
  };

  const handleDreamClick = (dream, index) => {
    setSelectedDream(dream);
    setSelectedIndex(index);
  };

  const handleClosePost = () => {
    setSelectedDream(null);
    setSelectedIndex(null);
  };

  const handleNavigate = (direction) => {
    const newIndex = direction === 'next' ? selectedIndex + 1 : selectedIndex - 1;
    if (newIndex >= 0 && newIndex < dreams.length) {
      setSelectedDream(dreams[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="Gallery-loading">
        <div className="loader"></div>
      </div>
    );
  }

  if (dreams.length === 0) {
    return (
      <div className="Gallery-container">
        <StarryBackground />
        <div className="Gallery-empty">
          <h2 className="Gallery-empty-text">No public dreams yet...</h2>
          <p>Be the first to share your dream!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="Gallery-container">
      <StarryBackground />
      <div className="Gallery-grid">
        {dreams.map((dream, index) => (
          <div
            key={dream._id}
            className="Gallery-item"
            onClick={() => handleDreamClick(dream, index)}
          >
            {dream.imageUrl ? (
              <img
                src={dream.imageUrl}
                alt="Dream visualization"
                className="Gallery-image"
                loading="lazy"
              />
            ) : (
              <div className="Gallery-placeholder">No image</div>
            )}
          </div>
        ))}
      </div>
      {selectedDream && (
        <PublicPost
          dream={selectedDream}
          onClose={handleClosePost}
          onNavigate={handleNavigate}
          currentIndex={selectedIndex}
          totalDreams={dreams.length}
        />
      )}
    </div>
  );
};

export default Gallery;