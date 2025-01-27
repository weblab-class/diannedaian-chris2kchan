import React from "react";
import cloud1 from "/assets/cloud1.png";
import cloud2 from "/assets/cloud2.png";
import cloud3 from "/assets/cloud3.png";
import "./DreamCloud.css";

const DreamCloud = ({ dream, position, onDreamClick }) => {
  // Cycle through clouds in order based on position
  const clouds = [cloud1, cloud2, cloud3];
  const cloudIndex = Math.floor(position / 400) % clouds.length;
  const cloudImage = clouds[cloudIndex];

  // Format the date - handle both string timestamps and Date objects
  const getFormattedDate = (dream) => {
    if (!dream) return "No Date";
    
    try {
      // Try different date fields in order of preference
      const dateStr = dream.dateCreated || dream.date || dream.timestamp;
      if (!dateStr) return "No Date";

      // Try parsing as ISO string
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
      
      return "Invalid Date";
    } catch (error) {
      console.error("Error parsing date:", error);
      return "Invalid Date";
    }
  };

  const handleClick = () => {
    if (onDreamClick && dream) {
      onDreamClick(dream);
    }
  };

  if (!dream) return null;

  return (
    <div 
      className="DreamCloud" 
      style={{ top: `${position}px` }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <img src={cloudImage} alt="Dream Cloud" className="DreamCloud-image" />
      <span className="DreamCloud-date">{getFormattedDate(dream)}</span>
    </div>
  );
};

export default DreamCloud;
