import React, { useState, useEffect, createContext } from "react";
import {Link, Outlet} from "react-router-dom";

import jwt_decode from "jwt-decode";
import "../utilities.css";

import { socket } from "../client-socket";
import { get, post } from "../utilities";

import Skeleton from "./pages/Skeleton";
import Gallery from "./Gallery";
import LoginScreen from "./pages/LoginScreen";

import "./App.css";

// Create a user context for managing authentication state
export const UserContext = createContext();

const App = () => {
  const [userId, setUserId] = useState(undefined);

  // Fetch user on mount to check if they are logged in
  useEffect(() => {
    get("/api/whoami").then((user) => {
      if (user._id) {
        setUserId(user._id);
      }
    });
  }, []);

  const handleLogin = (credentialResponse) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken);
    console.log(`Logged in as ${decodedCredential.name}`);

    post("/api/login", { token: userToken }).then((user) => {
      setUserId(user._id);
      post("/api/initsocket", { socketid: socket.id });
    });
  };

  const handleLogout = () => {
    setUserId(undefined);
    post("/api/logout");
  };

  const authContextValue = {
    userId,
    handleLogin,
    handleLogout,
  };

  return (
      <UserContext.Provider value={authContextValue}>
        {userId ? ( // ✅ Only show the app after login
          <>
            <nav className="navbar">
              <Link to="/">Home</Link>
              <Link to="/gallery">Gallery</Link>
            </nav>
            <Outlet />
          </>
        ) : (
          <LoginScreen handleLogin={handleLogin} /> // ✅ Show login screen if not logged in
        )}
      </UserContext.Provider>
  );
};

export default App;
