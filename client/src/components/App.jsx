import React, { useState, useEffect, createContext } from "react";
import { Outlet } from "react-router-dom";
import jwt_decode from "jwt-decode";

import { NavBar } from "./NavBar";
import LoginScreen from "./pages/LoginScreen";
import EnvelopeAnimation from "./modules/EnvelopeAnimation";

import "../utilities.css";
import "../fonts.css";
import "./App.css";

import { get, post } from "../utilities";
import { socket } from "../client-socket";

export const UserContext = createContext({});

const App = () => {
  const [userId, setUserId] = useState(undefined);
  const [userName, setUserName] = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await get("/api/whoami");
        if (user._id) {
          // User is logged in
          setUserId(user.googleid);
          setUserName(user.name);
        } else {
          // No user found, clear state
          setUserId(undefined);
          setUserName(undefined);
          setUserProfile(null);
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        // On error, clear state
        setUserId(undefined);
        setUserName(undefined);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Only run on mount

  // Fetch profile whenever userId changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (userId) {
        try {
          const response = await fetch(`/api/profile/${userId}`, {
            credentials: "include",
          });
          if (!response.ok) {
            throw new Error("Failed to fetch profile");
          }
          const data = await response.json();
          setUserProfile(data);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleLogin = async (credentialResponse) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken);

    try {
      setShowAnimation(true);
      
      // Wait for login to complete
      const user = await post("/api/login", { token: userToken });
      await post("/api/initsocket", { socketid: socket.id });
      
      // Set user data
      setUserId(user.googleid);
      setUserName(user.name);
      
      // Wait for profile to be created/fetched
      const profileResponse = await fetch(`/api/profile/${user.googleid}`, {
        credentials: "include",
      });
      const profile = await profileResponse.json();
      setUserProfile(profile);
      
    } catch (err) {
      console.error("Error during login:", err);
      setShowAnimation(false);
    }
  };

  const handleLogout = () => {
    setUserId(undefined);
    setUserName(undefined);
    setUserProfile(null);
    post("/api/logout");
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (showAnimation) {
    return (
      <EnvelopeAnimation
        onAnimationComplete={() => {
          setShowAnimation(false);
        }}
      />
    );
  }

  return (
    <UserContext.Provider value={{ userId, userName, userProfile, setUserProfile }}>
      {userId ? (
        <>
          <NavBar handleLogout={handleLogout} />
          <div className="App-container">
            <Outlet />
          </div>
        </>
      ) : (
        <LoginScreen handleLogin={handleLogin} />
      )}
    </UserContext.Provider>
  );
};

export default App;
