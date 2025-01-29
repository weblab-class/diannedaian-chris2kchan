import React, { useCallback, useMemo } from "react";
import "./DreamCloud.css";
import "../../fonts.css";

const DreamCloudComponent = ({ dream, position, onDreamClick }) => {
  // Memoize the cloud set function
  const getCloudSet = useCallback((dream) => {
    if (!dream || !Array.isArray(dream.tags)) {
      return ["/assets/cloud1.png", "/assets/cloud2.png", "/assets/cloud3.png"];
    }

    const hasJoyful = dream.tags.some((tag) => tag && tag.id === "joyful");
    const hasNightmare = dream.tags.some((tag) => tag && tag.id === "nightmare");
    const hasWeird = dream.tags.some((tag) => tag && tag.id === "weird");

    if (hasJoyful && !hasNightmare && !hasWeird) {
      return ["/assets/happycloud1.png", "/assets/happycloud2.png", "/assets/happycloud3.png"];
    } else if (hasNightmare && !hasJoyful && !hasWeird) {
      return ["/assets/sadcloud1.png", "/assets/sadcloud2.png", "/assets/sadcloud3.png"];
    } else if (hasWeird && !hasJoyful && !hasNightmare) {
      return ["/assets/weirdcloud1.png", "/assets/weirdcloud2.png", "/assets/weirdcloud3.png"];
    } else {
      return ["/assets/cloud1.png", "/assets/cloud2.png", "/assets/cloud3.png"];
    }
  }, []); // Empty dependency array since it doesn't depend on any props

  // Memoize clouds array and cloudImage
  const clouds = useMemo(() => getCloudSet(dream), [dream, getCloudSet]);
  const cloudIndex = Math.floor(position / 400) % clouds.length;
  const cloudImage = clouds[cloudIndex];

  // Memoize position calculations
  const isRightSide = Math.floor(position / 300) % 2 === 0;
  const cloudPosition = isRightSide ? 'right' : 'left';

  // Memoize date formatting
  const formattedDate = useMemo(() => {
    if (!dream) return "No Date";

    try {
      const dateStr = dream.dateCreated || dream.date || dream.timestamp;
      if (!dateStr) return "No Date";

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
  }, [dream]);

  const handleClick = useCallback(() => {
    if (onDreamClick && dream) {
      onDreamClick(dream);
    }
  }, [onDreamClick, dream]);

  if (!dream) return null;

  return (
    <div
      className={`DreamCloud DreamCloud-${cloudPosition}`}
      style={{ 
        top: `${position}px`,
        willChange: 'transform' 
      }}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label={`View dream from ${formattedDate}`}
    >
      <img 
        src={cloudImage} 
        alt="Dream Cloud" 
        className="DreamCloud-image"
        loading="lazy"
      />
      <div className="DreamCloud-date">{formattedDate}</div>
    </div>
  );
};

const DreamCloud = React.memo(DreamCloudComponent);

export default DreamCloud;
