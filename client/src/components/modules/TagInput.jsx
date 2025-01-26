import React, { useState, useRef, useEffect } from "react";
import "./TagInput.css";

const PRESET_TAGS = [
  { id: "daily", text: "Daily", color: "#E6E6FA" },
  { id: "special-event", text: "Special Event", color: "#FFE4B5" },
  { id: "work", text: "Work", color: "#B0E0E6" },
  { id: "personal", text: "Personal", color: "#FFB6C1" },
  { id: "planning", text: "Planning", color: "#FFDAB9" },
  { id: "art", text: "Art", color: "#D3D3D3" },
  { id: "life-lesson", text: "Life Lesson", color: "#98FB98" },
  { id: "career", text: "Career", color: "#90EE90" },
  { id: "research", text: "Research", color: "#FFC0CB" },
  { id: "travel", text: "Travel", color: "#F5F5F5" },
  { id: "school", text: "School", color: "#F5DEB3" },
];

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
      color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
    };

    handleTagSelect(newTag);
  };

  const handleTagSelect = (tag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
      setInputValue("");
      setIsDropdownOpen(false);
      setShowInput(false);
    }
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

  return (
    <div className="tag-input-container">
      <div className="selected-tags">
        {selectedTags.map(tag => (
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
            onClick={() => setShowInput(true)}
          >
            +
          </button>
        )}
      </div>
      
      {showInput && (
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="tag-input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Add tags..."
          />
          {isDropdownOpen && (
            <div className="tag-dropdown" ref={dropdownRef}>
              {filteredTags.map(tag => (
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
