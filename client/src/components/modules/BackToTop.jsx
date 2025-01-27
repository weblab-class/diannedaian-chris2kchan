import React from "react";
import "./BackToTop.css";

const BackToTop = ({ visible }) => {
  const scrollToRecentDream = () => {
    // Scroll to position where the most recent dream would be (300px from top)
    window.scrollTo({
      top: 300,
      behavior: "smooth"
    });
  };

  return (
    <button 
      className={`BackToTop ${visible ? 'visible' : ''}`}
      onClick={scrollToRecentDream}
      aria-label="Scroll back to recent dream"
    >
      Back to Top
    </button>
  );
};

export default BackToTop;
