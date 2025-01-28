import React from "react";
import "./DreamCloud.css";
import "../../fonts.css";

const DreamCloud = ({ dream, position, onDreamClick }) => {
  // Determine which set of clouds to use based on tags
  const getCloudSet = (dream) => {
    const hasJoyful = dream.tags?.some((tag) => tag.id === "joyful");
    const hasNightmare = dream.tags?.some((tag) => tag.id === "nightmare");

    if (hasJoyful && !hasNightmare) {
      return ["/assets/happycloud1.png", "/assets/happycloud2.png", "/assets/happycloud3.png"];
    } else if (hasNightmare && !hasJoyful) {
      return ["/assets/sadcloud1.png", "/assets/sadcloud2.png", "/assets/sadcloud3.png"];
    } else {
      return ["/assets/cloud1.png", "/assets/cloud2.png", "/assets/cloud3.png"];
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
        return date.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric",
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
