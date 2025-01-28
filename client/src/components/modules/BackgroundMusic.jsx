import React, { useState, useEffect } from "react";
import "./BackgroundMusic.css";

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio("/assets/dreammusic.mp3"));

  useEffect(() => {
    audio.loop = true;
    
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <button 
      className={`music-toggle ${isPlaying ? 'playing' : ''}`} 
      onClick={togglePlay}
      title={isPlaying ? "Pause Music" : "Play Music"}
    >
      {isPlaying ? "🎵" : "🔇"}
    </button>
  );
};

export default BackgroundMusic;
