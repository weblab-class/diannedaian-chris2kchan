import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import "./LoginScreen.css";
import loginBg from "../../assets/login.png";
import login1 from "../../assets/login1.png";
import login2 from "../../assets/login2.png";
import BackgroundMusic from "../modules/BackgroundMusic";

const LoginScreen = ({ handleLogin }) => {
  return (
    <div className="LoginScreen-container" style={{ backgroundImage: `url(${loginBg})` }}>
      <BackgroundMusic />
      <div className="login-screen">
        <h1>Welcome to Dreamscape</h1>
        <p>Log in to start generating and logging your dreams.</p>
      </div>
      <div className="google-login-wrapper">
        <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
      </div>
      <div className="cloud-background">
        <div className="cloud-layer cloud-layer-2" style={{ backgroundImage: `url(${login2})` }}></div>
        <div className="cloud-layer cloud-layer-1" style={{ backgroundImage: `url(${login1})` }}></div>
      </div>
    </div>
  );
};

export default LoginScreen;
