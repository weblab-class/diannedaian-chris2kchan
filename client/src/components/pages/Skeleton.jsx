import React, { useContext, useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./Skeleton.css";

import { UserContext } from "../App";

const Skeleton = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

  const [showInput, setShowInput] = useState(false); // Controls if the text box is visible
  const [inputText, setInputText] = useState(""); // Stores user input
  const [imageUrl, setImageUrl] = useState(""); // Stores AI-generated image
  const [dreams, setDreams] = useState([]); // Stores user's saved dreams
  const [selectedDate, setSelectedDate] = useState(new Date()); // Stores selected date
  const [isLoading, setIsLoading] = useState(false); // Controls loading spinner
  const [isPublic, setIsPublic] = useState(false);

  // Fetch dreams on login for the user
  useEffect(() => {
    if (userId) {
      console.log(`Fetching dreams for userId: ${userId}`); // Debugging log

      fetch(`/api/get-dreams/${userId}`)
        .then((res) => {
          console.log("API Response:", res.status); // Log response status
          return res.json();
        })
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
      // You might want to show this error to the user in the UI
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
    console.log("📡 Request Body:", { userId, text: inputText, imageUrl, date: selectedDate, public: isPublic });

    try {
      const response = await fetch(`/api/save-dream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          text: inputText,
          imageUrl,
          date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
          public: isPublic
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error saving dream:", errorText);
        throw new Error(`Failed to save dream: ${errorText}`);
      }

      const data = await response.json();
      if (data.success) {
        setDreams([data.dream, ...dreams]);
        setInputText("");
        setImageUrl("");
        setSelectedDate(new Date());
        setIsPublic(false);
        console.log("✅ Dream successfully saved!");
      }
    } catch (error) {
      console.error("❌ Error saving dream:", error);
    }
  };

  return (
    <div className="skeleton-container">
      {userId ? (
        <>
          <button className="logout-button" onClick={() => {
            googleLogout();
            handleLogout();
          }}>
            Logout
          </button>

          {!showInput ? (
            <button className="show-input-button" onClick={() => setShowInput(true)}>
              Create Dream Image
            </button>
          ) : (
            <div className="dream-input-container">
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date)}
                className="date-picker"
              />
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Describe your dream..."
                className="dream-input"
              />

              <div className="controls">
                <button onClick={generateImage} disabled={!inputText || isLoading}>
                  {isLoading ? "Generating..." : "Generate Image"}
                </button>

                <div className="privacy-control">
                  <label>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    Make dream public
                  </label>
                </div>

                <button onClick={saveDream} disabled={!inputText || !imageUrl}>
                  Save Dream
                </button>
              </div>

              {imageUrl && (
                <div className="generated-image">
                  <img src={imageUrl} alt="Generated dream visualization" />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div>Please log in to create and save your dream images.</div>
      )}
    </div>
  );
};

export default Skeleton;
