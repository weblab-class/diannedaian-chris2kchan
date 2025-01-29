import React, { useState, useRef, useEffect } from "react";
import "./TagInput.css";

const PRESET_TAGS = [
  { id: "nightmare", text: "Nightmare", color: "#FF4444" },
  { id: "joyful", text: "Joyful", color: "#FFD700" },
  { id: "neutral", text: "Neutral", color: "#E6E6FA" },
  { id: "weird", text: "Weird", color: "#4CAF50" },
];

// Generate a random vibrant color
const generateVibrantColor = () => {
  // HSL color space: Hue (0-360), Saturation (0-100%), Lightness (0-100%)
  const hue = Math.floor(Math.random() * 360); // Any hue
  const saturation = Math.floor(Math.random() * 20) + 80; // 80-100% saturation
  const lightness = Math.floor(Math.random() * 20) + 40; // 40-60% lightness
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const TagInput = ({ selectedTags, onTagsChange }) => {
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredTags, setFilteredTags] = useState(PRESET_TAGS);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setIsDropdownOpen(true);

    // Filter preset tags based on input
    const filtered = PRESET_TAGS.filter(tag =>
      tag.text.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTags(filtered);
  };

  const handleCreateTag = () => {
    if (!inputValue.trim()) return;
    
    const newTag = {
      id: inputValue.toLowerCase().replace(/\s+/g, '-'),
      text: inputValue.trim(),
      color: generateVibrantColor(),
    };

    handleTagSelect(newTag);
  };

  const handleTagSelect = (tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    setInputValue("");
    setIsDropdownOpen(false);
    setShowInput(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTags.length > 0) {
        handleTagSelect(filteredTags[0]);
      } else {
        handleCreateTag();
      }
    }
  };

  const handleAddButtonClick = () => {
    setShowInput(true);
    setIsDropdownOpen(true);
    setFilteredTags(PRESET_TAGS);
  };

  return (
    <div className="tag-input-container">
      <div className="selected-tags">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="tag"
            style={{ backgroundColor: tag.color }}
          >
            {tag.text}
            <button
              type="button"
              className="remove-tag"
              onClick={() => handleRemoveTag(tag)}
            >
              ×
            </button>
          </span>
        ))}
        {!showInput && (
          <button
            type="button"
            className="add-tag-button"
            onClick={handleAddButtonClick}
          >
            +
          </button>
        )}
      </div>

      {showInput && (
        <div className="input-wrapper" ref={inputRef}>
          <input
            type="text"
            className="tag-input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type to search or create tag..."
            autoFocus
          />
          {isDropdownOpen && (
            <div className="tag-dropdown" ref={dropdownRef}>
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="tag-option"
                  onClick={() => handleTagSelect(tag)}
                >
                  <span
                    className="color-preview"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.text}
                </div>
              ))}
              {inputValue && !filteredTags.find(t => 
                t.text.toLowerCase() === inputValue.toLowerCase()
              ) && (
                <div
                  className="tag-option create-option"
                  onClick={handleCreateTag}
                >
                  Create "{inputValue}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagInput;
