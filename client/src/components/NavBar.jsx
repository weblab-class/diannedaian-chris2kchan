import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./App";
import "./NavBar.css";

const NavBar = ({ handleLogout }) => {
  const { userId, userName } = useContext(UserContext);

  return (
    <nav className="NavBar-container">
      <div className="NavBar-title">
        <Link to="/" className="NavBar-link">
          Dreamscape
        </Link>
      </div>
      <div className="NavBar-linkContainer">
        <Link to="/gallery" className="NavBar-link">
          Gallery
        </Link>
        {userId && (
          <Link to="/profile" className="NavBar-link">
            Profile
          </Link>
        )}
        {userId ? (
          <button
            onClick={handleLogout}
            className="NavBar-link NavBar-button u-pointer"
          >
            Logout
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
