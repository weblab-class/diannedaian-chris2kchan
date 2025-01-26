import React, { useContext, useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import TagInput from "../modules/TagInput";
import "../../utilities.css";
import "./Skeleton.css";

import { UserContext } from "../App";

const Skeleton = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [dreams, setDreams] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    if (userId) {
      console.log(`Fetching dreams for userId: ${userId}`);
      fetch(`/api/get-dreams/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Received dreams data:", data);
          setDreams(data);
        })
        .catch((err) => console.error("Error fetching dreams:", err));
    }
  }, [userId]);

  const generateImage = async () => {
    if (!inputText) return;

    setIsLoading(true);
    setImageUrl("");

    try {
      console.log("🎨 Generating image...");
      const response = await fetch(`/api/generate-dream-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputText }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error generating image:", errorText);
        throw new Error(`Failed to generate image: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Image generated and uploaded:", data);
      
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error("❌ Error in image generation process:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDream = async () => {
    if (!inputText || !userId || !imageUrl) {
      console.log("❌ Missing required fields for saving dream");
      return;
    }

    console.log("📡 Saving dream...");

    try {
      const response = await fetch(`/api/dreams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          text: inputText,
          imageUrl,
          date: selectedDate.toISOString(),
          public: isPublic,
          tags: selectedTags,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error saving dream:", errorText);
        throw new Error(`Failed to save dream: ${errorText}`);
      }

      const newDream = await response.json();
      console.log("✅ Dream saved successfully:", newDream);
      
      setDreams([newDream, ...dreams]);
      setInputText("");
      setImageUrl("");
      setIsPublic(false);
      setSelectedTags([]);
      setShowInput(false);
    } catch (error) {
      console.error("❌ Error saving dream:", error);
    }
  };

  return (
    <>
      <div className="u-flex">
        <h1>Dreams</h1>
        {userId ? (
          <button
            className="logout-button"
            onClick={() => {
              googleLogout();
              handleLogout();
            }}
          >
            Logout
          </button>
        ) : (
          <GoogleLogin
            onSuccess={handleLogin}
            onError={() => console.log("Login Failed")}
          />
        )}
        <button
          className="NewDream-button u-pointer"
          onClick={() => setShowInput(!showInput)}
        >
          {showInput ? "Cancel" : "New Dream"}
        </button>
      </div>

      {showInput && (
        <div className="NewDream-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write your dream here..."
            className="NewDream-input"
          />
          
          <TagInput
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />

          <div className="NewDream-footer">
            <div className="NewDream-options">
              <label className="NewDream-checkbox">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                Make dream public
              </label>
              
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                className="NewDream-datepicker"
              />
            </div>

            <div className="NewDream-buttons">
              <button
                onClick={generateImage}
                className="NewDream-button u-pointer"
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? "Generating..." : "Generate Image"}
              </button>
              
              <button
                onClick={saveDream}
                className="NewDream-button u-pointer"
                disabled={!inputText.trim() || !imageUrl || isLoading}
              >
                Save Dream
              </button>
            </div>
          </div>

          {imageUrl && (
            <div className="NewDream-imagePreview">
              <img src={imageUrl} alt="Generated dream visualization" />
            </div>
          )}
        </div>
      )}

      <div className="DreamList-container">
        {dreams.map((dream, i) => (
          <div key={dream._id || i} className="Dream-card">
            {dream.public && dream.userProfile && (
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
              {dream.public && <span className="Dream-public">Public</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Skeleton;
