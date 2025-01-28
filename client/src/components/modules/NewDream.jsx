import React, { useState, useEffect } from "react";
import { post } from "../../utilities";
import TagInput from "./TagInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./NewDream.css";

const NewDream = ({ onNewDream, onClose }) => {
  const [dreamText, setDreamText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Disable scrolling on mount
    document.body.style.overflow = "hidden";

    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    // Set loaded after first render
    setIsLoaded(true);
  }, []);

  const handleGenerateImage = async () => {
    if (!dreamText.trim()) return;
    setIsGeneratingImage(true);
    try {
      const imageResponse = await post("/api/generate-dream-image", { prompt: dreamText });
      setGeneratedImage(imageResponse.imageUrl);
    } catch (err) {
      console.log(err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (!dreamText.trim()) {
        throw new Error("Dream text cannot be empty");
      }

      // Format tags to match database schema
      const formattedTags = selectedTags.map((tag) => ({
        id: tag.id,
        text: tag.text,
        color: tag.color,
      }));

      const dreamData = {
        text: dreamText,
        date: new Date().toISOString(),
        public: isPublic,
        tags: formattedTags,
        imageUrl: generatedImage || "",
      };

      console.log("Sending dream data:", dreamData);
      const response = await post("/api/dreams", dreamData);
      console.log("Dream saved successfully:", response);

      setDreamText("");
      setSelectedTags([]);
      setIsPublic(false);
      setGeneratedImage("");
      onClose();
    } catch (error) {
      console.error("Error saving dream:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        data: error.response?.data,
      });
      alert("Failed to save dream. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="NewDream-overlay" onClick={handleOverlayClick}>
      <div className="NewDream-popup" onClick={(e) => e.stopPropagation()}>
        <img src="/assets/postcard.png" className="NewDream-card-background" alt="Dream Card" />
        <form className="NewDream-form" onSubmit={handleSubmit}>
          <div className="NewDream-left-side">
            <div className="NewDream-date">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="MMMM d, yyyy"
                className="NewDream-date-input"
                placeholderText="Select date..."
              />
            </div>

            <div className="NewDream-image-area">
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated dream visualization"
                  className="NewDream-generated-image"
                />
              ) : (
                <div className="NewDream-image-placeholder">
                  {isGeneratingImage
                    ? "Generating..."
                    : "Your dream visualization will appear here"}
                </div>
              )}
            </div>

            <div className="NewDream-generate-button">
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !dreamText.trim()}
              >
                <img
                  src="/assets/generatedreambutton.png"
                  alt="Generate"
                  style={{ opacity: isGeneratingImage || !dreamText.trim() ? 0.5 : 1 }}
                />
              </button>
            </div>
          </div>

          <div className="NewDream-right-side">
            <div className="NewDream-top-controls">
              <div className="NewDream-tags">
                <TagInput
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  placeholder="Add tags..."
                />
              </div>

              <button type="submit" className="NewDream-save-button" disabled={isSubmitting}>
                <img src="/assets/savedreambutton.png" alt="Save Dream" />
              </button>
            </div>

            <div className="NewDream-toggle">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="NewDream-toggle-slider"></span>
              <span className="NewDream-toggle-label">{isPublic ? "Public" : "Private"}</span>
            </div>

            <div className="NewDream-text">
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                placeholder="Write your dream here..."
                className="NewDream-input"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDream;
