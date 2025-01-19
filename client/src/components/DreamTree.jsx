import React from "react";
import "./DreamTree.css"; // Add styles later

const DreamTree = ({ dreams }) => {
  return (
    <div className="tree-container">
      <img src="/tree-background.png" alt="Dream Tree" className="tree-bg" />
      {dreams.map((dream, index) => {
        const positionStyle = {
          top: `${80 - index * 15}%`, // Stagger dreams along the tree
          left: index % 2 === 0 ? "20%" : "70%",
        };

        return (
          <div key={dream._id} className="dream-catcher" style={positionStyle}>
            <img src="/dreamcatcher.png" alt="Dream Catcher" />
            <span className="dream-date">{new Date(dream.date).toLocaleDateString()}</span>
            <p className="dream-text">{dream.content}</p>
          </div>
        );
      })}
    </div>
  );
};

export default DreamTree;
