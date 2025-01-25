import React, { useState, useEffect, createContext } from "react";
import { Outlet } from "react-router-dom";
import jwt_decode from "jwt-decode";

import { NavBar } from "./NavBar";
import LoginScreen from "./pages/LoginScreen";

import "../utilities.css";
import "./App.css";

import { get, post } from "../utilities";
import { socket } from "../client-socket";

export const UserContext = createContext({});

const App = () => {
  const [userId, setUserId] = useState(undefined);
  const [userName, setUserName] = useState(undefined);

  useEffect(() => {
    get("/api/whoami").then((user) => {
      if (user._id) {
        setUserId(user._id);
        setUserName(user.name);
      }
    });
  }, []);

  const handleLogin = (credentialResponse) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken);
    console.log(`Logged in as ${decodedCredential.name}`);
    post("/api/login", { token: userToken }).then((user) => {
      setUserId(user._id);
      setUserName(user.name);
      post("/api/initsocket", { socketid: socket.id });
    });
  };

  const handleLogout = () => {
    setUserId(undefined);
    setUserName(undefined);
    post("/api/logout");
  };

  return (
    <UserContext.Provider value={{ userId, userName }}>
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
