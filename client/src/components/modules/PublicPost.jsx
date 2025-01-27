import React from "react";
import "./PublicPost.css";

const PublicPost = ({ dream, onClose }) => {
  return (
    <div className="PublicPost-overlay" onClick={onClose}>
      <div className="PublicPost-container" onClick={(e) => e.stopPropagation()}>
        <div className="PublicPost-content">
          <div className="PublicPost-left">
            <img src={dream.imageUrl} alt="Dream" className="PublicPost-image" />
          </div>
          <div className="PublicPost-right">
            <div className="PublicPost-header">
              <div className="PublicPost-user">
                <img 
                  src={dream.userProfile?.picture || "/assets/profilepic.png"} 
                  alt="Profile" 
                  className="PublicPost-profile-pic" 
                />
                <span className="PublicPost-username">{dream.userProfile?.name || "Anonymous Dreamer"}</span>
              </div>
              <button className="PublicPost-close" onClick={onClose}>×</button>
            </div>
            <div className="PublicPost-details">
              <p className="PublicPost-text">{dream.text}</p>
              <div className="PublicPost-tags">
                {dream.tags?.map((tag) => (
                  <span 
                    key={tag.id} 
                    className="PublicPost-tag"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.text}
                  </span>
                ))}
              </div>
            </div>
            <div className="PublicPost-divider"></div>
            <div className="PublicPost-comments">
              {/* Comments section - to be implemented */}
              <p className="PublicPost-no-comments">No comments yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicPost;
