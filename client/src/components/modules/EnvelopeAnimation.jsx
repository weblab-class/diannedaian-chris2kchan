import React, { useEffect } from "react";
import "./EnvelopeAnimation.css";

const EnvelopeAnimation = ({ onAnimationComplete }) => {
  useEffect(() => {
    // After 4 seconds, call onAnimationComplete to unmount the component
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="envelope-animation">
      <div className="envelope-container">
        <img src="/assets/envelope3.png" alt="Envelope 3" className="envelope envelope3" />
        <img src="/assets/envelope2.png" alt="Envelope 2" className="envelope envelope2" />
        <img src="/assets/envelope1.png" alt="Envelope 1" className="envelope envelope1" />
      </div>
    </div>
  );
};

export default EnvelopeAnimation;
