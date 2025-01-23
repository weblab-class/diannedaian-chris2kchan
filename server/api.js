/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OpenAI API key in environment variables!");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const router = express.Router();

// import models so we can interact with the database
const User = require("./models/user");
const Dream = require("./models/dream"); // Import the Dream model

// import authentication library
const auth = require("./auth");

//initialize socket
const socketManager = require("./server-socket");

//Import Cloudinary upload routes
const cloudinaryUpload = require("./cloudinaryUpload");
router.use(cloudinaryUpload);

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
router.post("/generate-dream-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    console.log("🎨 Generating image with prompt:", prompt);
    
    // Generate image using OpenAI
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No image data received from OpenAI");
    }

    const imageUrl = response.data[0].url;
    console.log("✅ Generated image URL:", imageUrl);

    // Upload directly to Cloudinary from the OpenAI URL
    const cloudinary = require("cloudinary").v2;
    const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
      folder: "dreamscape",
      timeout: 60000,
    });

    console.log("✅ Uploaded to Cloudinary:", uploadResponse.secure_url);

    res.json({ 
      imageUrl: uploadResponse.secure_url,
      public_id: uploadResponse.public_id
    });

  } catch (error) {
    console.error("Error generating/uploading image:", error);
    res.status(500).json({ error: error.message });
  }
});

// Saving user dreams
router.post("/save-dream", async (req, res) => {
  try {
    const { userId, text, imageUrl, public, date } = req.body;

    if (!userId || !text || !imageUrl) {
      console.error("❌ Missing required fields:", { userId, text, imageUrl });
      return res.status(400).json({ error: "Missing required fields" });
    }


    // ✅ Ensure `date` is properly formatted
    const formattedDate = date ? new Date(date) : new Date();

    const newDream = new Dream({
      userId,
      text,
      imageUrl: imageUrl || "", // Ensure imageUrl is never undefined
      public: public || false, // Default `public` to false if not provided
      date: formattedDate, // ✅ Corrected field name
    });

    await newDream.save();
    console.log("✅ Dream saved successfully:", newDream);
    res.json({ success: true, dream: newDream });

  } catch (error) {
    console.error("❌ FULL ERROR:", error); // ❗ Prints the actual issue!
    res.status(500).json({ error: error.message || "Failed to save dream" });
  }
});

// Retrieving user dreams
router.get("/get-dreams/:userId", async (req, res) => {
  try {
    console.log(`📡 Received GET request for userId: ${req.params.userId}`); // Debugging log
    const dreams = await Dream.find({ userId: req.params.userId }).sort({ date: -1 });
    console.log(`Found ${dreams.length} dreams for user ${req.params.userId}`);
    res.json(dreams);
  } catch (error) {
    console.error("Error fetching dreams:", error);
    res.status(500).json({ error: "Failed to fetch dreams" });
  }
});




// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
