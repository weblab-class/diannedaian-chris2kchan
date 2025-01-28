import React, { useState } from "react";
import "./MiniGallery.css";

const MiniGallery = ({ dreams, userId }) => {
  const [selectedDream, setSelectedDream] = useState(null);

  const handleDreamClick = (dream) => {
    setSelectedDream(dream === selectedDream ? null : dream);
  };

  return (
    <div className="mini-gallery">
      <div className="mini-gallery-grid">
        {dreams.map((dream) => (
          <div 
            key={dream._id} 
            className={`mini-gallery-item ${selectedDream === dream ? 'selected' : ''}`}
            onClick={() => handleDreamClick(dream)}
          >
            {dream.imageUrl ? (
              <div className="mini-dream-preview">
                <img 
                  src={dream.imageUrl} 
                  alt="Dream visualization" 
                  className="mini-dream-image"
                />
                <div className="mini-dream-overlay">
                  <div className="mini-dream-text">{dream.text}</div>
                  <div className="mini-dream-date">
                    {new Date(dream.date).toLocaleDateString()}
                  </div>
                  <div className="mini-dream-tags">
                    {dream.tags.map((tag) => (
                      <span 
                        key={tag.id} 
                        className="mini-dream-tag"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mini-dream-preview no-image">
                <div className="mini-dream-text-only">
                  {dream.text}
                </div>
                <div className="mini-dream-date">
                  {new Date(dream.date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedDream && (
        <div className="dream-modal-overlay" onClick={() => setSelectedDream(null)}>
          <div className="dream-modal" onClick={(e) => e.stopPropagation()}>
            {selectedDream.imageUrl && (
              <img 
                src={selectedDream.imageUrl} 
                alt="Dream visualization" 
                className="dream-modal-image"
              />
            )}
            <div className="dream-modal-content">
              <div className="dream-modal-text">{selectedDream.text}</div>
              <div className="dream-modal-date">
                {new Date(selectedDream.date).toLocaleDateString()}
              </div>
              <div className="dream-modal-tags">
                {selectedDream.tags.map((tag) => (
                  <span 
                    key={tag.id} 
                    className="dream-modal-tag"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.text}
                  </span>
                ))}
              </div>
            </div>
            <button className="dream-modal-close" onClick={() => setSelectedDream(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniGallery;
