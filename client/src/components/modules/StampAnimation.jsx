import React, { useEffect } from "react";
import "./StampAnimation.css";

const StampAnimation = ({ onAnimationComplete }) => {
  useEffect(() => {
    console.log("🎯 Stamp animation started");
    const timer = setTimeout(() => {
      console.log("🎯 Stamp animation completed");
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 1500); // Match this with the CSS animation duration

    return () => {
      console.log("🎯 Cleaning up stamp animation");
      clearTimeout(timer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="stamp-container">
      <img src="/assets/stamp.png" alt="Dream Saved" className="stamp" />
    </div>
  );
};

export default StampAnimation;
