import React, { useContext, useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import { Link } from "react-router-dom";

import TagInput from "../modules/TagInput";
import StarryBackground from "../modules/StarryBackground";
import ScrollingTreeStem from "../modules/ScrollingTreeStem"; 
import AddDreamButton from "../modules/AddDreamButton";
import { NavBar } from "../NavBar";
import Postcard from "../modules/Postcard"; // Import Postcard component
import "../../utilities.css";
import "./Skeleton.css";

import { UserContext } from "../App";

const GOOGLE_CLIENT_ID = "713619431927-oqe8d6r0nfi9dj1s60kceepr5c0hcjlg.apps.googleusercontent.com";

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
  const [userProfile, setUserProfile] = useState(null);
  const [selectedDream, setSelectedDream] = useState(null);
  const [selectedDreamIndex, setSelectedDreamIndex] = useState(null);
  const [showPostcard, setShowPostcard] = useState(false);

  // Add refresh interval for profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    if (userId) {
      // Initial fetch
      fetchProfile();

      // Refresh every 30 seconds
      const intervalId = setInterval(fetchProfile, 30000);

      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [userId]);

  useEffect(() => {
    const fetchDreams = async () => {
      if (!userId) return; // Don't fetch if not logged in

      try {
        const response = await fetch(`/api/get-user-dreams/${userId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch dreams: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Sort dreams by date, newest first
        const sortedDreams = data.sort((a, b) => {
          const dateA = new Date(a.dateCreated || a.date);
          const dateB = new Date(b.dateCreated || b.date);
          return dateB - dateA;
        });

        console.log("✨ Fetched dreams:", sortedDreams);
        setDreams(sortedDreams);
      } catch (err) {
        console.error("❌ Error fetching dreams:", err);
        // Don't clear dreams on error - keep existing state
      }
    };

    // Fetch dreams immediately when userId is available
    fetchDreams();

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(fetchDreams, 30000);

    // Cleanup interval on unmount or userId change
    return () => clearInterval(intervalId);
  }, [userId]); // Only re-run if userId changes

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
      
      // Add the new dream to the dreams list
      setDreams([newDream, ...dreams]);
      
      // Reset form
      setInputText("");
      setImageUrl("");
      setIsPublic(false);
      setSelectedTags([]);
      setShowInput(false);
    } catch (error) {
      console.error("❌ Error saving dream:", error);
    }
  };

  const toggleDreamPrivacy = async (dreamId) => {
    try {
      const response = await fetch(`/api/toggle-dream-privacy/${dreamId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle dream privacy");
      }

      const updatedDream = await response.json();
      
      // Update the dreams list with the toggled dream
      setDreams(dreams.map(d => d._id === updatedDream._id ? updatedDream : d));
    } catch (error) {
      console.error("Error toggling dream privacy:", error);
      alert(error.message || "Failed to toggle dream privacy. Please try again.");
    }
  };

  const handleDreamClick = (dream, index) => {
    console.log("Opening dream at index:", index);
    setSelectedDream(dream);
    setSelectedDreamIndex(index);
    setShowPostcard(true);
    setShowInput(false);
  };

  const handleNavigateUp = () => {
    console.log("Navigating up from index:", selectedDreamIndex);
    if (selectedDreamIndex > 0) {
      const newIndex = selectedDreamIndex - 1;
      const newDream = dreams[newIndex];
      console.log("New dream:", newDream);
      setSelectedDream(newDream);
      setSelectedDreamIndex(newIndex);
    }
  };

  const handleNavigateDown = () => {
    console.log("Navigating down from index:", selectedDreamIndex);
    if (selectedDreamIndex < dreams.length - 1) {
      const newIndex = selectedDreamIndex + 1;
      const newDream = dreams[newIndex];
      console.log("New dream:", newDream);
      setSelectedDream(newDream);
      setSelectedDreamIndex(newIndex);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {userId && (
        <div>
          <NavBar
            handleLogout={handleLogout}
            userId={userId}
            userProfile={userProfile}
          />
          <div className="App-treestem">
            <ScrollingTreeStem 
              dreams={dreams} 
              onDreamClick={handleDreamClick}
            />
          </div>
          {showPostcard && selectedDream && (
            <div 
              className="postcard-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowPostcard(false);
                  setSelectedDream(null);
                  setSelectedDreamIndex(null);
                }
              }}
            >
              <Postcard
                dream={selectedDream}
                onClose={() => {
                  setShowPostcard(false);
                  setSelectedDream(null);
                  setSelectedDreamIndex(null);
                }}
                onUpdate={(updatedDreamOrId) => {
                  // Handle dream deletion
                  if (typeof updatedDreamOrId === 'string') {
                    // If it's a string, it's a dream ID to delete
                    setDreams(dreams.filter(d => d._id !== updatedDreamOrId));
                    setShowPostcard(false);
                    setSelectedDream(null);
                    setSelectedDreamIndex(null);
                  } else {
                    // If it's an object, it's an updated dream
                    setDreams(dreams.map(d => 
                      d._id === updatedDreamOrId._id ? updatedDreamOrId : d
                    ));
                    setSelectedDream(updatedDreamOrId);
                  }
                }}
                isFirstDream={selectedDreamIndex === 0}
                isLastDream={selectedDreamIndex === dreams.length - 1}
                onNavigateUp={handleNavigateUp}
                onNavigateDown={handleNavigateDown}
              />
            </div>
          )}
          <StarryBackground />
          <AddDreamButton onNewDream={(newDream) => {
            // Add the new dream to the beginning of the list
            setDreams(prevDreams => [newDream, ...prevDreams]);
            
            // Scroll to top to show the new dream
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }} />
          <div className="App-container">
            <div style={{ display: "none" }}>
              <div style={{ display: "none" }}>
                <Link to={`/profile/${userId}`} className="profile-link">
                  <img 
                    src="/assets/profilepic.png"
                    alt="Profile" 
                    className="header-avatar" 
                  />
                  <span className="header-username">{userProfile?.name || "Dreamer"}</span>
                </Link>
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
                <h2>My Dreams</h2>
                {dreams.map((dream, i) => (
                  <div key={dream._id || i} className="Dream-card">
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
                      <button
                        onClick={() => toggleDreamPrivacy(dream._id)}
                        className="Dream-privacyToggle"
                      >
                        {dream.public ? "Make Private" : "Make Public"}
                      </button>
                      {dream.public && <span className="Dream-public">Public</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {!userId && (
        <div className="App-container">
          <StarryBackground />
          <div className="login-container">
            <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
};

export default Skeleton;
