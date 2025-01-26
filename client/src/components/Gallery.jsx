import React, { useState, useEffect, useContext } from "react";
import StarryBackground from "./modules/StarryBackground";
import { UserContext } from "./App";
import "./Gallery.css";

const Gallery = () => {
  const [dreams, setDreams] = useState([]);
  const { userId } = useContext(UserContext);

  useEffect(() => {
    // Fetch public dreams
    fetch("/api/public-dreams", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Received public dreams:", data);
        setDreams(data);
      })
      .catch((err) => console.error("Error fetching public dreams:", err));
  }, []);

  const toggleDreamPrivacy = async (dreamId) => {
    try {
      const response = await fetch(`/api/toggle-dream-privacy/${dreamId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle dream privacy");
      }

      const updatedDream = await response.json();
      
      // Update the dreams list with the toggled dream
      setDreams(dreams.map(d => d._id === updatedDream._id ? updatedDream : d));
    } catch (error) {
      console.error("Error toggling dream privacy:", error);
      alert(error.message || "Failed to toggle dream privacy. Please try again.");
    }
  };

  return (
    <div style={{ display: "none" }} className="Gallery-container">
      <StarryBackground />
      <div className="u-flex">
        <h1>Public Dreams Gallery</h1>
      </div>

      <div className="DreamList-container">
        {dreams.map((dream, i) => (
          <div key={dream._id || i} className="Dream-card">
            {dream.userProfile && (
              <div className="Dream-author">
                <img
                  src={dream.userProfile.picture}
                  alt={dream.userProfile.name}
                  className="Dream-authorPic"
                />
                <span className="Dream-authorName">{dream.userProfile.name}</span>
              </div>
            )}
            <p>{dream.text}</p>
            {dream.imageUrl && (
              <img src={dream.imageUrl} alt="Dream visualization" className="Dream-image" />
            )}
            <div className="Dream-tags">
              {dream.tags?.map((tag) => (
                <span
                  key={tag.id}
                  className="tag"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.text}
                </span>
              ))}
            </div>
            <div className="Dream-footer">
              <span>{new Date(dream.date).toLocaleDateString()}</span>
              {userId === dream.userId && (
                <button
                  className="Dream-privacy"
                  onClick={() => toggleDreamPrivacy(dream._id)}
                >
                  {dream.public ? "Make Private" : "Make Public"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
