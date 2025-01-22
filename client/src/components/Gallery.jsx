import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "./App";

const Gallery = () => {
  const { userId } = useContext(UserContext);
  const [dreams, setDreams] = useState([]);

  useEffect(() => {
    if (userId) {
      fetch(`/api/get-dreams/${userId}`)
        .then((res) => res.json())
        .then((data) => setDreams(data))
        .catch((err) => console.error("❌ Error fetching dreams:", err));
    }
  }, [userId]);

  return (
    <div className="gallery-container">
      <h2>Your Dream Gallery</h2>
      {dreams.length === 0 ? (
        <p>No dreams logged yet.</p>
      ) : (
        <div className="dream-list">
          {dreams.map((dream) => (
            <div key={dream._id} className="dream-entry">
              <p>{dream.text}</p>
              {dream.imageUrl && <img src={dream.imageUrl} alt="Dream" />}
              <span>{new Date(dream.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
