import React, { useState, useEffect, useRef } from "react";
import { get } from "../../utilities";
import PublicPost from "../modules/PublicPost";
import StarryBackground from "../modules/StarryBackground";
import "./Gallery.css";

// Tag color mapping
const TAG_COLORS = {
  joyful: "#FFD700",
  nightmare: "#FF4444",
  neutral: "#E6E6FA",
  weird: "#4CAF50",
};

// Priority tags order
const PRIORITY_TAGS = ["joyful", "neutral", "nightmare", "weird"];

const Gallery = () => {
  const [dreams, setDreams] = useState([]);
  const [allDreams, setAllDreams] = useState([]);
  const [selectedDream, setSelectedDream] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTagListOpen, setIsTagListOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadDreams();
    // Add click outside listener
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsTagListOpen(false);
        if (!selectedTags.length) {
          setIsSearchOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedTags.length]);

  useEffect(() => {
    // Extract unique tags from all dreams
    const tags = new Set();
    allDreams.forEach(dream => {
      dream.tags?.forEach(tag => {
        tags.add(tag.text.toLowerCase());
      });
    });
    setAvailableTags(Array.from(tags).sort());
  }, [allDreams]);

  useEffect(() => {
    // Filter dreams based on selected tags
    if (selectedTags.length === 0) {
      setDreams(allDreams);
    } else {
      const filteredDreams = allDreams.filter(dream => 
        selectedTags.every(selectedTag =>
          dream.tags?.some(tag => tag.text.toLowerCase() === selectedTag.toLowerCase())
        )
      );
      setDreams(filteredDreams);
      setSelectedDream(null);
      setSelectedIndex(null);
    }
  }, [selectedTags, allDreams]);

  const loadDreams = async () => {
    try {
      const response = await get("/api/public-dreams");
      setAllDreams(response);
      setDreams(response);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dreams:", error);
      setLoading(false);
    }
  };

  const handleDreamClick = (dream, index) => {
    setSelectedDream(dream);
    setSelectedIndex(index);
  };

  const handleClosePost = () => {
    setSelectedDream(null);
    setSelectedIndex(null);
  };

  const handleNavigate = (direction) => {
    const newIndex = direction === 'next' ? selectedIndex + 1 : selectedIndex - 1;
    if (newIndex >= 0 && newIndex < dreams.length) {
      setSelectedDream(dreams[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  const handleTagClick = (tag) => {
    setSelectedTags(prev => {
      const tagLower = tag.toLowerCase();
      if (prev.includes(tagLower)) {
        return prev.filter(t => t !== tagLower);
      } else {
        return [...prev, tagLower];
      }
    });
  };

  const handleClearTags = () => {
    setSelectedTags([]);
    setTagSearch("");
    setIsTagListOpen(false);
    if (!isSearchOpen) {
      setIsSearchOpen(false);
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSearchFocus = () => {
    setIsTagListOpen(true);
  };

  const getTagColor = (tag) => {
    return TAG_COLORS[tag.toLowerCase()] || "rgba(107, 138, 253, 0.2)";
  };

  // Sort tags with priority tags first
  const sortTags = (tags) => {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    const priorityTagsPresent = PRIORITY_TAGS.filter(tag => lowerTags.includes(tag));
    const otherTags = lowerTags.filter(tag => !PRIORITY_TAGS.includes(tag)).sort();
    return [...priorityTagsPresent, ...otherTags];
  };

  // Filter available tags based on search and sort them
  const filteredTags = sortTags(
    availableTags.filter(tag =>
      tag.toLowerCase().includes(tagSearch.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="Gallery-loading">
        <div className="loader"></div>
      </div>
    );
  }

  if (dreams.length === 0) {
    return (
      <div className="Gallery-container">
        <StarryBackground />
        <div className="Gallery-empty">
          <h2 className="Gallery-empty-text">
            {selectedTags.length > 0 
              ? `No dreams found with selected tags: ${selectedTags.join(", ")}`
              : "No public dreams yet..."}
          </h2>
          {selectedTags.length > 0 ? (
            <button className="Gallery-clear-search" onClick={handleClearTags}>
              Clear Filters
            </button>
          ) : (
            <p>Be the first to share your dream!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="Gallery-container">
      <StarryBackground />
      <div 
        ref={searchContainerRef}
        className={`Gallery-search-container ${isSearchOpen ? 'open' : ''}`}
      >
        {!isSearchOpen ? (
          <img 
            src="/assets/search.png" 
            alt="Search" 
            className="Gallery-search-icon"
            onClick={handleSearchIconClick}
          />
        ) : (
          <div className="Gallery-search-content">
            <div className="Gallery-search-input-wrapper">
              <input
                ref={searchInputRef}
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                onFocus={handleSearchFocus}
                placeholder="Search tags..."
                className="Gallery-tag-search"
              />
              {selectedTags.length > 0 && (
                <button className="Gallery-clear-search" onClick={handleClearTags}>
                  Clear All
                </button>
              )}
            </div>
            <div className="Gallery-selected-tags">
              {sortTags(selectedTags).map(tag => (
                <button
                  key={tag}
                  className="Gallery-tag-button active"
                  onClick={() => handleTagClick(tag)}
                  style={{ 
                    background: getTagColor(tag),
                    boxShadow: `0 0 10px ${getTagColor(tag)}80`
                  }}
                >
                  {tag} ×
                </button>
              ))}
            </div>
            {isTagListOpen && (
              <div className="Gallery-tags-dropdown">
                {filteredTags
                  .filter(tag => !selectedTags.includes(tag.toLowerCase()))
                  .map(tag => (
                    <button
                      key={tag}
                      className="Gallery-tag-button"
                      onClick={() => handleTagClick(tag)}
                      style={{ 
                        background: getTagColor(tag),
                        opacity: 0.7
                      }}
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="Gallery-grid">
        {dreams.map((dream, index) => (
          <div
            key={dream._id}
            className="Gallery-item"
            onClick={() => handleDreamClick(dream, index)}
          >
            {dream.imageUrl ? (
              <img
                src={dream.imageUrl}
                alt="Dream visualization"
                className="Gallery-image"
                loading="lazy"
              />
            ) : (
              <div className="Gallery-placeholder">No image</div>
            )}
          </div>
        ))}
      </div>
      {selectedDream && (
        <PublicPost
          dream={selectedDream}
          onClose={handleClosePost}
          onNavigate={handleNavigate}
          currentIndex={selectedIndex}
          totalDreams={dreams.length}
        />
      )}
    </div>
  );
};

export default Gallery;