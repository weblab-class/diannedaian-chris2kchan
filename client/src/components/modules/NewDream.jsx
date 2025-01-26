import React, { useState } from "react";
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

  const handleGenerateImage = async () => {
    if (!dreamText.trim()) return;
    setIsGeneratingImage(true);
    try {
      const imageResponse = await post("/api/generate-image", { prompt: dreamText });
      setGeneratedImage(imageResponse.imageUrl);
    } catch (err) {
      console.log(err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!dreamText.trim()) return;

    try {
      const dream = {
        text: dreamText,
        imageUrl: generatedImage,
        public: isPublic,
        tags: selectedTags,
        date: selectedDate,
      };

      const newDream = await post("/api/dreams", dream);
      onNewDream(newDream);
      
      // Reset form and close popup
      setDreamText("");
      setSelectedTags([]);
      setIsPublic(false);
      setGeneratedImage(null);
      onClose();
    } catch (err) {
      console.log(err);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="NewDream-overlay" onClick={handleOverlayClick}>
      <div className="NewDream-popup">
        <img src="/assets/postcard.png" alt="Dream Card" className="NewDream-card-background" />
        <form onSubmit={handleSubmit} className="NewDream-form">
          <div className="NewDream-left-side">
            <div className="NewDream-date">
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date)}
                dateFormat="MMMM d, yyyy"
                className="NewDream-date-input"
                placeholderText="Select date..."
              />
            </div>
            
            <div className="NewDream-image-area">
              {generatedImage ? (
                <img src={generatedImage} alt="Generated Dream" className="NewDream-generated-image" />
              ) : (
                <div className="NewDream-image-placeholder">
                  {isGeneratingImage ? "Generating..." : "AI Image will appear here"}
                </div>
              )}
            </div>

            <div className="NewDream-generate-button">
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={!dreamText.trim() || isGeneratingImage}
              >
                <img src="/assets/generatedreambutton.png" alt="Generate Dream" />
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

              <button type="submit" className="NewDream-save-button">
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
