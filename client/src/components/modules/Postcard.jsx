import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TagInput from "./TagInput";
import { post } from "../../utilities";
import "./NewDream.css";

const Postcard = ({ dream, onClose, onUpdate }) => {
  // Initialize isPublic with the dream's public state, defaulting to false if undefined
  const [dreamText, setDreamText] = useState(dream.text || "");
  const [selectedDate, setSelectedDate] = useState(dream.dateCreated ? new Date(dream.dateCreated) : new Date());
  const [selectedTags, setSelectedTags] = useState(dream.tags || []);
  const [isPublic, setIsPublic] = useState(dream.public === true);
  const [imageUrl, setImageUrl] = useState(dream.imageUrl || "");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Disable scrolling on mount
    document.body.style.overflow = 'hidden';
    setIsLoaded(true);
    console.log("Initial dream public state:", dream.public);
    console.log("Initial isPublic state:", isPublic);
    
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleGenerateImage = async () => {
    if (!dreamText.trim()) return;
    setIsGeneratingImage(true);
    try {
      const response = await post("/api/generate-dream-image", { prompt: dreamText });
      setImageUrl(response.imageUrl);
    } catch (err) {
      console.log("Error generating image:", err);
    }
    setIsGeneratingImage(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!dreamText.trim()) return;

    try {
      console.log("Original dream:", dream);
      console.log("Current public state:", isPublic);
      
      const updatedDream = {
        _id: dream._id,
        text: dreamText,
        dateCreated: selectedDate.toISOString(),
        tags: selectedTags,
        public: isPublic,
        imageUrl: imageUrl,
        userId: dream.userId
      };

      console.log("Sending update request with data:", updatedDream);
      const response = await post("/api/dreams/update", updatedDream);
      console.log("Received updated dream:", response);
      
      if (onUpdate) {
        onUpdate(response);
      }
      onClose();
    } catch (err) {
      console.log("Error updating dream:", err);
      if (err.response) {
        console.log("Error response:", err.response);
        alert(`Failed to update dream: ${err.response.data?.error || 'Please try again.'}`);
      } else {
        alert("Failed to update dream. Please try again.");
      }
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="NewDream-overlay" onClick={onClose}>
      <div className="NewDream-popup" onClick={(e) => e.stopPropagation()}>
        <img src="/assets/postcard.png" className="NewDream-card-background" alt="Dream Card" />
        <div className="NewDream-form">
          <div className="NewDream-left-side">
            <div className="NewDream-date">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="MMMM d, yyyy"
                className="NewDream-date-input"
              />
            </div>
            <div className="NewDream-image-area">
              {imageUrl ? (
                <img src={imageUrl} alt="Dream visualization" className="NewDream-generated-image" />
              ) : (
                <div className="NewDream-image-placeholder">Your dream visualization will appear here</div>
              )}
            </div>
            <div className="NewDream-generate-button">
              <button onClick={handleGenerateImage} disabled={isGeneratingImage || !dreamText.trim()}>
                <img 
                  src="/assets/generatedreambutton.png"
                  alt="Generate" 
                  style={{ opacity: isGeneratingImage || !dreamText.trim() ? 0.5 : 1 }}
                />
              </button>
            </div>
          </div>

          <div className="NewDream-right-side">
            <div className="NewDream-tags">
              <TagInput
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
              />
            </div>
            <div className="NewDream-toggle">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => {
                  console.log("Toggling public state to:", e.target.checked);
                  setIsPublic(e.target.checked);
                }}
              />
              <span className="NewDream-toggle-slider"></span>
              <span className="NewDream-toggle-label">Make Public</span>
            </div>
            <div className="NewDream-text">
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                placeholder="Write your dream here..."
                className="NewDream-input"
              />
            </div>
            <button className="NewDream-save-button" onClick={handleSave} disabled={!dreamText.trim()}>
              <img 
                src="/assets/savedreambutton.png"
                alt="Save" 
                style={{ opacity: !dreamText.trim() ? 0.5 : 1 }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Postcard;
