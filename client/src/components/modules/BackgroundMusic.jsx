import React, { useState, useRef, useEffect } from "react";
import "./BackgroundMusic.css";

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef(new Audio("/assets/dreammusic.mp3"));

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = 0.3;
    
    // Cleanup function
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const audio = audioRef.current;
    
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Audio play failed:", error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="music-container">
      <button className="music-toggle" onClick={togglePlay}>
        <img 
          src={isPlaying ? "/assets/musicon.png" : "/assets/musicoff.png"} 
          alt={isPlaying ? "Music On" : "Music Off"} 
          className="music-icon"
        />
      </button>
    </div>
  );
};

export default BackgroundMusic;
