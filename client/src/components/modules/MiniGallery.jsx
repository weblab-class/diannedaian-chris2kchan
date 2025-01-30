import React, { useState } from "react";
import "./MiniGallery.css";
import PublicPost from "./PublicPost";

const MiniGallery = ({ dreams, userId, onDreamsChange }) => {
  const [selectedDream, setSelectedDream] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDreamClick = (dream, index) => {
    setSelectedDream(dream);
    setSelectedIndex(index);
  };

  const handleClosePost = () => {
    setSelectedDream(null);
    setSelectedIndex(null);
  };

  const handleDreamDelete = (deletedDreamId) => {
    // Update local state
    const updatedDreams = dreams.filter(dream => dream._id !== deletedDreamId);
    // Notify parent component
    if (onDreamsChange) {
      onDreamsChange(updatedDreams);
    }
    handleClosePost();
  };

  const handleNavigate = (direction) => {
    const newIndex = direction === 'next' ? selectedIndex + 1 : selectedIndex - 1;
    if (newIndex >= 0 && newIndex < dreams.length) {
      setSelectedDream(dreams[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  return (
    <div className="mini-gallery">
      <div className="mini-gallery-grid">
        {dreams.map((dream, index) => (
          <div 
            key={dream._id} 
            className={`mini-gallery-item ${selectedDream === dream ? 'selected' : ''}`}
            onClick={() => handleDreamClick(dream, index)}
          >
            {dream.imageUrl ? (
              <div className="mini-dream-container">
                <img 
                  src={dream.imageUrl} 
                  alt="Dream visualization" 
                  className="mini-dream-image"
                />
                <div className="mini-dream-overlay">
                  <div className="mini-dream-date">{formatDate(dream.date)}</div>
                  <div className="mini-dream-stats">
                    <div className="mini-dream-stat">
                      <img src="/assets/liked.png" alt="Likes" className="mini-dream-stat-icon" />
                      <span>{dream.likesCount || 0}</span>
                    </div>
                    <div className="mini-dream-stat">
                      <img src="/assets/comment.png" alt="Comments" className="mini-dream-stat-icon" />
                      <span>{dream.commentsCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mini-dream-placeholder">No image</div>
            )}
          </div>
        ))}
      </div>

      {selectedDream && (
        <PublicPost
          dream={selectedDream}
          onClose={handleClosePost}
          currentIndex={selectedIndex}
          totalDreams={dreams.length}
          onNavigate={(direction) => handleNavigate(direction === 'prev' ? 'prev' : 'next')}
          onDreamDelete={handleDreamDelete}
        />
      )}
    </div>
  );
};

export default MiniGallery;
