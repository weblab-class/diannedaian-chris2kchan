import React, { useEffect, useState } from "react";
import "./StampAnimation.css";
import stampImage from "/assets/stamp.png";

const StampAnimation = ({ onAnimationComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log("🎯 Stamp animation started");
    const timer = setTimeout(() => {
      console.log("🎯 Stamp animation completed");
      setIsVisible(false);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 1500); // Match this with the CSS animation duration

    return () => {
      console.log("🎯 Cleaning up stamp animation");
      clearTimeout(timer);
    };
  }, [onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <div className="stamp-container">
      <img src={stampImage} alt="Dream Saved" className="stamp" />
    </div>
  );
};

export default StampAnimation;
