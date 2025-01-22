import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import "./LoginScreen.css";

const LoginScreen = ({ handleLogin }) => {
  return (
    <div className="login-screen">
      <h1>Welcome to Dreamscape</h1>
      <p>Log in to start generating and logging your dreams.</p>
      <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
    </div>
  );
};

export default LoginScreen;
