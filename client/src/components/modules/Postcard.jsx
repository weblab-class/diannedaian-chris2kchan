import React, { useState, useEffect, useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TagInput from "./TagInput";
import { post } from "../../utilities";
import { UserContext } from "../App";
import "./NewDream.css";
import "./Postcard.css";

const Postcard = ({
  dream,
  onClose,
  onUpdate,
  isFirstDream,
  isLastDream,
  onNavigateUp,
  onNavigateDown
}) => {
  const { userId } = useContext(UserContext);
  const [dreamText, setDreamText] = useState(dream.text || "");
  const [selectedDate, setSelectedDate] = useState(dream.dateCreated ? new Date(dream.dateCreated) : new Date());
  const [selectedTags, setSelectedTags] = useState(dream.tags || []);
  const [isPublic, setIsPublic] = useState(dream.public === true);
  const [imageUrl, setImageUrl] = useState(dream.imageUrl || "");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Disable scrolling on mount
    document.body.style.overflow = 'hidden';
    setIsLoaded(true);
    console.log("Initial dream public state:", dream.public);
    console.log("Initial isPublic state:", isPublic);
    console.log("Current userId:", userId);

    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    setDreamText(dream.text || "");
    setSelectedDate(dream.dateCreated ? new Date(dream.dateCreated) : new Date());
    setSelectedTags(dream.tags || []);
    setIsPublic(dream.public === true);
    setImageUrl(dream.imageUrl || "");
  }, [dream]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Format tags to match database schema
      const formattedTags = selectedTags.map(tag => ({
        id: tag.id,
        text: tag.text,
        color: tag.color
      }));

      const updatedDream = {
        _id: dream._id,
        text: dreamText,
        dateCreated: selectedDate.toISOString(),
        public: isPublic,
        tags: formattedTags,
        imageUrl: imageUrl,
        userId: userId
      };

      const response = await post("/api/dreams/update", updatedDream);
      console.log("Dream updated successfully:", response);
      if (onUpdate) {
        onUpdate(response);
      }
      onClose();
    } catch (error) {
      console.error("Error updating dream:", error);
      if (error.message === "Please log in to save your dream") {
        alert(error.message);
      } else if (error.response) {
        console.log("Error response:", error.response);
        alert(`Failed to update dream: ${error.response.data?.error || 'Please try again.'}`);
      } else {
        alert("Failed to update dream. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this dream? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dreams/${dream._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete dream");
      }

      // Pass just the ID when deleting
      if (onUpdate) {
        onUpdate(dream._id);
      }
      onClose();
    } catch (error) {
      console.error("Error deleting dream:", error);
      alert(`Failed to delete dream: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="NewDream-overlay" onClick={onClose}>
      <div className="NewDream-popup" onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'relative' }}>
          <img src="/assets/postcard.png" className="NewDream-card-background" alt="Dream Card" />
          {!isFirstDream && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateUp();
              }}
              style={{
                position: 'absolute',
                top: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                zIndex: 1000,
              }}
            >
              <img
                src="/assets/uparrow.png"
                alt="Previous Dream"
                style={{
                  width: '40px',
                  height: '40px',
                }}
              />
            </button>
          )}
          {!isLastDream && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateDown();
              }}
              style={{
                position: 'absolute',
                bottom: '-45px',
                left: '50%',
                transform: 'translateX(-50%)',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                zIndex: 1000,
              }}
            >
              <img
                src="/assets/downarrow.png"
                alt="Next Dream"
                style={{
                  width: '40px',
                  height: '40px',
                }}
              />
            </button>
          )}
          {userId === dream.userId && (
            <button 
              className="Postcard-deleteButton" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <img
                src="/assets/trashcan.png"
                alt={isDeleting ? "Deleting..." : "Delete"}
                style={{ opacity: isDeleting ? 0.5 : 1 }}
              />
            </button>
          )}
        </div>
        <form className="NewDream-form" onSubmit={handleSubmit}>
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
            <button className="NewDream-save-button" type="submit" disabled={!dreamText.trim() || isSubmitting}>
              <img
                src="/assets/savedreambutton.png"
                alt="Save"
                style={{ opacity: !dreamText.trim() || isSubmitting ? 0.5 : 1 }}
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Postcard;
