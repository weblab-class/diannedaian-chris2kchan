import React, { useEffect, useState, useRef } from "react";
import treeStemImage from "/assets/treestem.png";
import DreamCloud from "./DreamCloud";
import BackToTop from "./BackToTop";
import "./ScrollingTreeStem.css";

const ScrollingTreeStem = ({ dreams = [], onDreamClick }) => {
  const containerRef = useRef(null);
  const [bottomImages, setBottomImages] = useState(5);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  // Fixed number of images for the top part
  const TOP_IMAGES = 3;

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Update last scroll position
      const isScrollingDown = scrollPosition > lastScrollY.current;
      lastScrollY.current = scrollPosition;

      // Show back to top when we've scrolled past the first few dreams
      setShowBackToTop(scrollPosition > windowHeight);

      // Add images at the bottom when scrolling down
      if (isScrollingDown && scrollPosition + windowHeight > documentHeight - 1000) {
        setBottomImages((prev) => prev + 2);
      }

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        // Reset any scroll-related state if needed
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [dreams.length]);

  // Filter out any invalid dreams and calculate positions
  const cloudPositions = dreams
    .filter((dream) => {
      const isValid = dream && (dream.date || dream.timestamp || dream.dateCreated);
      return isValid;
    })
    .map((dream, index) => ({
      ...dream,
      position: 300 + index * 400,
    }));

  return (
    <>
      <div className="tree-stem-container" ref={containerRef}>
        <div className="tree-stem-content">
          {/* Fixed top section */}
          {[...Array(TOP_IMAGES)].map((_, index) => (
            <img
              key={`top-${index}`}
              src={treeStemImage}
              alt="Tree Stem"
              className="tree-stem-image"
              loading="lazy"
            />
          ))}
          
          {/* Dream clouds */}
          {cloudPositions.map((dream) => (
            <DreamCloud
              key={dream._id}
              dream={dream}
              position={dream.position}
              onDreamClick={onDreamClick}
            />
          ))}
          
          {/* Growing bottom section */}
          {[...Array(bottomImages)].map((_, index) => (
            <img
              key={`bottom-${index}`}
              src={treeStemImage}
              alt="Tree Stem"
              className="tree-stem-image"
              loading="lazy"
            />
          ))}
        </div>
      </div>
      <BackToTop visible={showBackToTop} />
    </>
  );
};

export default ScrollingTreeStem;
