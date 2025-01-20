/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user)
    socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

// OpenAI DALLE Image Generation Endpoint
const axios = require("axios");
require("dotenv").config();

router.post("/generate-dream-image", async (req, res) => {
  try {
    const { prompt } = req.body; // Get dream description from frontend

    // Check if API Key exists
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API Key" });
    }


    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        model: "dall-e-2",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Ensure the response is valid
    if (!response.data || !response.data.data || !response.data.data[0].url) {
      return res.status(500).json({ error: "Invalid response from OpenAI" });
    }


    res.json({ imageUrl: response.data.data[0].url });
  } catch (error) {
    console.error("Error generating image:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to generate image" });
  }
});




// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
