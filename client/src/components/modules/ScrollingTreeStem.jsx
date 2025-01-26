import React, { useEffect, useState, useRef } from "react";
import treeStemImage from "../../../dist/assets/treestem.png";
import "./ScrollingTreeStem.css";

const ScrollingTreeStem = () => {
  const containerRef = useRef(null);
  const [topImages, setTopImages] = useState(5); // Images above initial viewport
  const [bottomImages, setBottomImages] = useState(5); // Images below initial viewport
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Detect scroll direction
      const isScrollingDown = scrollPosition > lastScrollY.current;
      lastScrollY.current = scrollPosition;

      // Add images at the bottom when scrolling down
      if (isScrollingDown && scrollPosition + windowHeight > documentHeight - 1000) {
        setBottomImages(prev => prev + 3);
      }
      
      // Add images at the top when scrolling up
      if (!isScrollingDown && scrollPosition < 1000) {
        setTopImages(prev => prev + 3);
        // Maintain scroll position when adding images at top
        window.scrollBy(0, 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="tree-stem-container" ref={containerRef}>
      <div className="tree-stem-content">
        {[...Array(topImages + bottomImages)].map((_, index) => (
          <img 
            key={index}
            src={treeStemImage}
            alt="Tree Stem" 
            className="tree-stem-image"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

export default ScrollingTreeStem;
