import React, { useState } from "react";
import NewDream from "./NewDream";
import "./AddDreamButton.css";

const AddDreamButton = ({ onNewDream }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <>
      <button className="AddDreamButton" onClick={() => setIsPopupOpen(true)}>
        <img src="/assets/addbutton.png" alt="Add Dream" className="AddDreamButton-image" />
      </button>
      {isPopupOpen && (
        <NewDream
          onNewDream={onNewDream}
          onClose={() => setIsPopupOpen(false)}
        />
      )}
    </>
  );
};

export default AddDreamButton;
