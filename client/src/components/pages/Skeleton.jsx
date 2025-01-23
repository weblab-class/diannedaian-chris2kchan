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
    if (!inputText) return; // Prevent empty input

    setIsLoading(true); // Show loading spinner
    setImageUrl(""); // Clear previous image

    try {
      // Step 1: Generate Image from OpenAI API
      const response = await fetch(`/api/generate-dream-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputText }),
      });

      if (!response.ok) {
        console.error("Error generating image:", await response.text());
        return;
      }

      const data = await response.json();
      const generatedImageUrl = data.imageUrl; // Temporary OpenAI image URL

      console.log("Generated image URL:", generatedImageUrl);

      // Step 2: Upload Image to Cloudinary
      const cloudinaryResponse = await fetch(`/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: generatedImageUrl }), // Send OpenAI image URL
      });

      if (!cloudinaryResponse.ok) {
        console.error("Error uploading to Cloudinary:", await cloudinaryResponse.text());
        return;
      }

      const cloudinaryData = await cloudinaryResponse.json();
      setImageUrl(cloudinaryData.imageUrl); // Set Cloudinary URL

      console.log("✅ Image uploaded to Cloudinary:", cloudinaryData.imageUrl);
    } catch (error) {
      console.error("Error generating or uploading image:", error);
    } finally {
      setIsLoading(false); // Hide loading spinner
    }
  };


  const saveDream = async () => {
    if (!inputText || !userId || !imageUrl) return;

    console.log(" Sending request to save dream...");
    console.log("Request Body:", { userId, text: inputText, imageUrl, date: selectedDate });

    try {
      const response = await fetch(`/api/save-dream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          text: inputText,
          imageUrl, // Now using Cloudinary URL
          date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error("Error saving dream:", await response.text());
        return;
      }

      const data = await response.json();
      if (data.success) {
        setDreams([data.dream, ...dreams]); // Add new dream to UI
        setInputText(""); // Clear input
        setImageUrl(""); // Clear image
        setSelectedDate(new Date()); // Reset date
        console.log("✅ Dream successfully saved!");
      }
    } catch (error) {
      console.error("Error saving dream:", error);
    }
  };


  return (
    <div className="skeleton-container">
      {userId ? (
        <>
          <button className="logout-button"
            onClick={() => {
              googleLogout();
              handleLogout();
            }}
          >
            Logout
          </button>

          {!showInput ? (
            <button className="show-input-button" onClick={() => setShowInput(true)}>
              Create Dream Image
            </button>
          ) : (
            <div className="input-box">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Describe your dream..."
              />
              {/* ✅ Add Date Picker Here */}
              <div className="date-picker-container">
                <label>Select Date:</label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split("T")[0]} // Format YYYY-MM-DD
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
              <button className="generate-button" onClick={generateImage} disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Image"} {/* ✅ Button text updates */}
              </button>

              {/* ✅ Show Loading Spinner */}
              {isLoading && <div className="spinner"></div>}

              {/* ✅ Show Image when ready */}
              {imageUrl && <img src={imageUrl} alt="Dream" className="dream-image" />}




              <button className="save-button" onClick={saveDream}>
                Log Dream
              </button>
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
