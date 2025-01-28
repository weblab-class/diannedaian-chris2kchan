import React from "react";
import cloud1 from "/assets/cloud1.png";
import cloud2 from "/assets/cloud2.png";
import cloud3 from "/assets/cloud3.png";
import happyCloud1 from "/assets/happycloud1.png";
import happyCloud2 from "/assets/happycloud2.png";
import happyCloud3 from "/assets/happycloud3.png";
import sadCloud1 from "/assets/sadcloud1.png";
import sadCloud2 from "/assets/sadcloud2.png";
import sadCloud3 from "/assets/sadcloud3.png";
import "./DreamCloud.css";
import "../../fonts.css";

const DreamCloud = ({ dream, position, onDreamClick }) => {
  // Determine which set of clouds to use based on tags
  const getCloudSet = (dream) => {
    const hasJoyful = dream.tags?.some(tag => tag.id === "joyful");
    const hasNightmare = dream.tags?.some(tag => tag.id === "nightmare");

    if (hasJoyful && !hasNightmare) {
      return [happyCloud1, happyCloud2, happyCloud3];
    } else if (hasNightmare && !hasJoyful) {
      return [sadCloud1, sadCloud2, sadCloud3];
    } else {
      return [cloud1, cloud2, cloud3];
    }
  };

  // Get appropriate cloud set and cycle through them
  const clouds = getCloudSet(dream);
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
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
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
      tabIndex={0}
      role="button"
      aria-label={`View dream from ${getFormattedDate(dream)}`}
    >
      <img src={cloudImage} alt="Dream Cloud" className="DreamCloud-image" />
      <div className="DreamCloud-date">{getFormattedDate(dream)}</div>
    </div>
  );
};

export default DreamCloud;
