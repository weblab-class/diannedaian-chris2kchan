import React, { useState, useEffect } from "react";
import "./Gallery.css";
import PublicPost from "../modules/PublicPost.jsx";
import { get } from "../../utilities";

const Gallery = () => {
  const [publicDreams, setPublicDreams] = useState([]);
  const [selectedDream, setSelectedDream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicDreams = async () => {
      try {
        console.log("Fetching public dreams...");
        const data = await get("/api/public-dreams");
        console.log("Received public dreams:", data);
        
        if (!data) {
          console.error("No data received from server");
          setError("No data received from server");
          return;
        }
        
        // Sort by date, newest first
        const sortedDreams = data.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
        console.log("Sorted dreams:", sortedDreams);
        setPublicDreams(sortedDreams);
      } catch (error) {
        console.error("Error fetching public dreams:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicDreams();
  }, []);

  const handleDreamClick = (dream) => {
    console.log("Clicked dream:", dream);
    setSelectedDream(dream);
  };

  const handleClosePost = () => {
    setSelectedDream(null);
  };

  if (loading) {
    return (
      <div className="Gallery-loading">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="Gallery-container">
        <div className="Gallery-empty">
          <div className="Gallery-empty-text">Error loading dreams</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="Gallery-container">
      {publicDreams.length === 0 ? (
        <div className="Gallery-empty">
          <div className="Gallery-empty-text">No public dreams yet</div>
          <div>Dreams marked as public will appear here for everyone to see</div>
        </div>
      ) : (
        <div className="Gallery-grid">
          {publicDreams.map((dream) => (
            <div
              key={dream._id}
              className="Gallery-item"
              onClick={() => handleDreamClick(dream)}
            >
              <img src={dream.imageUrl} alt="Dream" className="Gallery-image" />
            </div>
          ))}
        </div>
      )}

      {selectedDream && (
        <PublicPost
          dream={selectedDream}
          onClose={handleClosePost}
        />
      )}
    </div>
  );
};

export default Gallery;