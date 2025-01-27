import React, { useState, useEffect } from "react";
import envelope1 from "/assets/envelope1.png";
import envelope2 from "/assets/envelope2.png";
import envelope3 from "/assets/envelope3.png";
import "./EnvelopeAnimation.css";

const EnvelopeAnimation = ({ onAnimationComplete }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const envelopes = [envelope1, envelope2, envelope3];

  useEffect(() => {
    // Animation sequence timing
    const timings = [0, 600, 1200]; // Show each frame for 600ms
    
    // Set up the frame sequence
    timings.forEach((timing, index) => {
      setTimeout(() => {
        setCurrentFrame(index);
      }, timing);
    });

    // Start fade out before component unmounts
    setTimeout(() => {
      setIsVisible(false);
    }, 1800);

    // Call onAnimationComplete after fade out
    setTimeout(() => {
      onAnimationComplete();
    }, 2300); // Give enough time for fade out animation
  }, [onAnimationComplete]);

  return (
    <div className={`envelope-animation ${isVisible ? 'visible' : 'hidden'}`}>
      <img 
        src={envelopes[currentFrame]} 
        alt="Envelope Animation" 
        className="envelope-frame"
      />
    </div>
  );
};

export default EnvelopeAnimation;
