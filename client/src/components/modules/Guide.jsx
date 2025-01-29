import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../App.jsx";
import "./Guide.css";

const Guide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { userProfile, setUserProfile } = useContext(UserContext);
  const totalPages = 2;

  useEffect(() => {
    // Show guide automatically for new users
    if (userProfile && !userProfile.preferences?.hasSeenGuide) {
      setIsOpen(true);
      // Mark guide as seen
      markGuideAsSeen();
    }
  }, [userProfile]);

  useEffect(() => {
    // Reset imageLoaded state when page changes
    setImageLoaded(false);
  }, [currentPage]);

  useEffect(() => {
    // Handle music player visibility
    const musicContainer = document.querySelector('.music-container');
    if (musicContainer) {
      if (isOpen) {
        musicContainer.style.opacity = '0.3';
        musicContainer.style.pointerEvents = 'none';
      } else {
        musicContainer.style.opacity = '1';
        musicContainer.style.pointerEvents = 'auto';
      }
    }
  }, [isOpen]);

  const markGuideAsSeen = async () => {
    try {
      const response = await fetch(`/api/profile/update-preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          preferences: {
            ...userProfile.preferences,
            hasSeenGuide: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const toggleGuide = () => {
    setIsOpen(!isOpen);
  };

  const togglePage = (e) => {
    e.stopPropagation();
    setCurrentPage(currentPage === 1 ? 2 : 1);
  };

  return (
    <div className="Guide-container">
      <button className="Guide-button" onClick={toggleGuide}>
        <img src="/assets/infobutton.png" alt="Info" className="Guide-icon" />
      </button>

      {isOpen && (
        <div className="Guide-overlay" onClick={() => setIsOpen(false)}>
          <div className="Guide-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={`/assets/guide${currentPage}.png`} 
              alt={`Guide page ${currentPage}`} 
              className="Guide-image" 
              onClick={togglePage}
              onLoad={() => setImageLoaded(true)}
            />
            
            {imageLoaded && (
              <div className="Guide-pagination">
                {currentPage} / {totalPages}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Guide;
