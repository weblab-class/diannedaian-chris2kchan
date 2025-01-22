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

  const [dreams, setDreams] = useState([]); // Stores user's saved dreams

  // fetchs the dreams on log for the user logging in
  useEffect(() => {
    if (userId) {
      console.log(`📡 Fetching dreams for userId: ${userId}`); // Debugging log

      fetch(`https://your-render-backend-url.com/api/get-dreams/${userId}`)
        .then((res) => {
          console.log("📡 API Response:", res.status); // Log response status
          return res.json();
        })
        .then((data) => {
          console.log("Received dreams data:", data);
          setDreams(data);
        })
        .catch((err) => console.error(" Error fetching dreams:", err));
    }
  }, [userId]);




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



  const saveDream = async () => {
    if (!inputText || !userId) return;

    const response = await fetch("https://your-render-backend-url.com/api/save-dream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, text: inputText, imageUrl }),
    });

    const data = await response.json();
    if (data.success) {
      setDreams([data.dream, ...dreams]); // Add new dream to UI
      setInputText(""); // Clear input
      setImageUrl(""); // Clear image
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
                placeholder="Describe your dream..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button className="generate-button" onClick={generateImage}>Generate Image</button>
              {imageUrl && <button className="save-button" onClick={saveDream}>Log Dream</button>}
            </div>
          )}

          {imageUrl && <img src={imageUrl} alt="Generated Dream" className="dream-image" />}

          {/* Display Saved Dreams */}
          <h2>Your Dream Journal</h2>
          {dreams.map((dream) => (
            <div key={dream._id} className="dream-entry">
              <p>{dream.text}</p>
              {dream.imageUrl && <img src={dream.imageUrl} alt="Dream" />}
              <span>{new Date(dream.date).toLocaleDateString()}</span>
            </div>
          ))}

        </>
      ) : (
        <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
      )}
    </div>
  );
};

export default Skeleton;
