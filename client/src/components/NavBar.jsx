import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./App";
import "./NavBar.css";

const NavBar = ({ handleLogout, onDreamscapeClick }) => {
  const { userId, userName } = useContext(UserContext);

  return (
    <nav className="NavBar-container">
      <div className="NavBar-title">
        <a href="/" className="NavBar-link" onClick={onDreamscapeClick}>
          dreamscape
        </a>
      </div>
      <div className="NavBar-linkContainer">
        <Link to="/gallery" className="NavBar-link">
          gallery
        </Link>
        {userId && (
          <Link to="/profile" className="NavBar-link">
            profile
          </Link>
        )}
        {userId ? (
          <button
            onClick={handleLogout}
            className="NavBar-link NavBar-button u-pointer"
          >
            logout
          </button>
        ) : (
          <button
            onClick={() => {
              window.location.href = "/auth/google";
            }}
            className="NavBar-link NavBar-button u-pointer"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

const NotFound = () => {
  return (
    <div className="NotFound-container">
      <h1>404 Not Found</h1>
      <p>The page you requested couldn't be found.</p>
      <Link to="/" className="NotFound-link">
        Go Home
      </Link>
    </div>
  );
};

export { NavBar, NotFound };
