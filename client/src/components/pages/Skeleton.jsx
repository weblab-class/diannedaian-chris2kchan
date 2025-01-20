import React, { useContext, useState } from "react";

import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./Skeleton.css";

import { UserContext } from "../App";

const Skeleton = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

  const [showInput, setShowInput] = useState(false); // Controls if the text box is visible
  const [inputText, setInputText] = useState(""); // Stores user input
  const [imageUrl, setImageUrl] = useState(""); // Stores AI-generated image

  const generateImage = async () => {
    if (!inputText) return; // Prevent empty input

    const response = await fetch("/api/generate-dream-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: inputText }),
    });

    const data = await response.json();
    setImageUrl(data.imageUrl); // Store generated image URL
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
                placeholder="Describe your dream..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button className="generate-button" onClick={generateImage}>Generate Image</button>
            </div>
          )}

          {imageUrl && <img src={imageUrl} alt="Generated Dream" className="dream-image" />}
        </>
      ) : (
        <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
      )}
    </div>
  );
};

export default Skeleton;
