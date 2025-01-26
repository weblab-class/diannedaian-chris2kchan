import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import "./LoginScreen.css";

const LoginScreen = ({ handleLogin }) => {
  return (
    <div className="LoginScreen-container">
      <div className="login-screen">
        <h1>Welcome to Dreamscape</h1>
        <p>Log in to start generating and logging your dreams.</p>
      </div>
      <div className="google-login-wrapper">
        <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
      </div>
      <div className="cloud-background">
        <div className="cloud-layer cloud-layer-2"></div>
        <div className="cloud-layer cloud-layer-1"></div>
      </div>
    </div>
  );
};

export default LoginScreen;
