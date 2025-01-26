import React, { useState } from "react";
import { post } from "../../utilities";
import TagInput from "./TagInput";
import "./NewDream.css";

const NewDream = ({ onNewDream }) => {
  const [dreamText, setDreamText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!dreamText.trim()) return;

    setIsGeneratingImage(true);
    try {
      // First, generate the image
      const imageResponse = await post("/api/generate-image", { prompt: dreamText });
      
      // Then create the dream with the generated image URL
      const dream = {
        text: dreamText,
        imageUrl: imageResponse.imageUrl,
        public: isPublic,
        tags: selectedTags,
      };

      const newDream = await post("/api/dreams", dream);
      onNewDream(newDream);
      
      // Reset form
      setDreamText("");
      setSelectedTags([]);
      setIsPublic(false);
    } catch (err) {
      console.log(err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="NewDream-container">
      <form onSubmit={handleSubmit}>
        <textarea
          value={dreamText}
          onChange={(e) => setDreamText(e.target.value)}
          placeholder="Write your dream here..."
          className="NewDream-input"
        />
        <TagInput
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />
        <div className="NewDream-footer">
          <label className="NewDream-checkbox">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Make dream public
          </label>
          <button
            type="submit"
            className="NewDream-button u-pointer"
            disabled={!dreamText.trim() || isGeneratingImage}
          >
            {isGeneratingImage ? "Creating Dream..." : "Create Dream"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewDream;
