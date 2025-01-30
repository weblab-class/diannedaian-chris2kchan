import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App.jsx";
import "./PublicPost.css";
import { post, get } from "../../utilities";

const PublicPost = ({ dream, onClose, onNavigate, currentIndex, totalDreams, onDreamDelete }) => {
  const { userId, userProfile } = useContext(UserContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [likes, setLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent background scrolling when post is open
    document.body.style.overflow = 'hidden';
    fetchComments();
    fetchLikes();
    return () => {
      // Restore scrolling when post is closed
      document.body.style.overflow = 'unset';
    };
  }, [dream._id]);

  const fetchComments = async () => {
    try {
      console.log("Fetching comments for dream:", dream._id);
      const response = await get(`/api/comments/${dream._id}`);
      console.log("Received comments:", response);
      setComments(response.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)));
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLikes = async () => {
    try {
      const response = await get(`/api/likes/${dream._id}`);
      setLikes(response.likes);
      setUserLiked(response.userLiked);
    } catch (err) {
      console.error("Error fetching likes:", err);
    }
  };

  const handleSubmitComment = async (event) => {
    event.preventDefault();
    if (!newComment.trim() || !userId) return;

    try {
      console.log("Submitting comment for dream:", dream._id);
      const commentData = {
        dreamId: dream._id,
        content: newComment.trim(),
      };

      const response = await post("/api/comment", commentData);
      console.log("Comment created:", response);
      
      // Add the new comment with the current user's profile info
      const commentWithProfile = {
        ...response,
        userProfile: {
          _id: userId,
          name: userProfile.name,
          picture: userProfile.picture
        }
      };
      
      setComments([commentWithProfile, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Failed to post comment. Please try again.");
    }
  };

  const handleLike = async () => {
    if (!userId) return;
    try {
      const response = await post("/api/like", { dreamId: dream._id });
      setUserLiked(response.liked);
      setLikes(prev => response.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleProfileClick = (googleId) => {
    onClose(); // Close the post first
    // If it's your own comment, go to editable profile
    if (googleId === userId) {
      navigate("/profile");
    } else {
      navigate(`/profile/${googleId}`);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this dream? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dreams/${dream._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete dream");
      }

      if (onDreamDelete) {
        onDreamDelete(dream._id);
      }
      onClose();
    } catch (error) {
      console.error("Error deleting dream:", error);
      alert(`Failed to delete dream: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="PublicPost-overlay" onClick={onClose}>
      {currentIndex > 0 && (
        <button 
          className="PublicPost-nav-arrow left"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('prev');
          }}
        >
          <img src="/assets/leftarrow.png" alt="Previous" />
        </button>
      )}
      
      {currentIndex < totalDreams - 1 && (
        <button 
          className="PublicPost-nav-arrow right"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('next');
          }}
        >
          <img src="/assets/rightarrow.png" alt="Next" />
        </button>
      )}

      <div className="PublicPost-container" onClick={(e) => e.stopPropagation()}>
        <img src={dream.imageUrl} alt="Dream" className="PublicPost-image" />
        <div className="PublicPost-tape1"></div>
        <div className="PublicPost-tape2"></div>
        <img src="/assets/stamp.png" alt="Stamp" className="PublicPost-stamp" />
        
        <div className="PublicPost-text-container">
          <p className="PublicPost-text">{dream.text}</p>
        </div>

        <div className="PublicPost-info">
          <span className="PublicPost-date">{formatDate(dream.date)}</span>
          {dream.tags && dream.tags.length > 0 && (
            <div className="PublicPost-tags">
              {dream.tags.map((tag, index) => (
                <span
                  key={index}
                  className="PublicPost-tag"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.text}
                </span>
              ))}
            </div>
          )}
        </div>

        <div 
          className="PublicPost-profile-section" 
          onClick={() => handleProfileClick(dream.creator._id)}
        >
          <img
            src={dream.creator.picture}
            alt="Profile"
            className="PublicPost-profile-pic"
          />
          <span className="PublicPost-username">
            {dream.creator.name}
          </span>
        </div>

        <div className="PublicPost-interactions">
          <button 
            className={`PublicPost-likeButton ${userLiked ? 'liked' : ''}`} 
            onClick={handleLike}
          >
            <img 
              src={userLiked ? "/assets/liked.png" : "/assets/unliked.png"} 
              alt={userLiked ? "Unlike" : "Like"} 
              className="PublicPost-likeIcon"
            />
            <span className="PublicPost-likeCount">{likes}</span>
          </button>
        </div>

        <div className="PublicPost-comments">
          <div className="PublicPost-comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="PublicPost-comment-input"
            />
            <button
              onClick={handleSubmitComment}
              className="PublicPost-comment-submit"
              disabled={!newComment.trim() || !userId}
            >
              Post
            </button>
          </div>

          {isLoading ? (
            <div>Loading comments...</div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="PublicPost-comment">
                <div 
                  className="PublicPost-comment-header"
                  onClick={() => handleProfileClick(comment.userId.googleid)}
                >
                  <img
                    src={comment.userProfile?.picture || "/assets/profilepic.png"}
                    alt="Profile"
                    className="PublicPost-comment-pic"
                  />
                  <span className="PublicPost-comment-username">
                    {comment.userProfile?.name || "Anonymous Dreamer"}
                  </span>
                  <span className="PublicPost-comment-date">
                    {formatDate(comment.dateCreated)}
                  </span>
                </div>
                <p className="PublicPost-comment-content">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {userId === dream.creator._id && (
          <button 
            className="PublicPost-deleteButton" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <img
              src="/assets/trashcan.png"
              alt={isDeleting ? "Deleting..." : "Delete"}
              style={{ opacity: isDeleting ? 0.5 : 1 }}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default PublicPost;
