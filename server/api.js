/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");
const auth = require("./auth");
const Dream = require("./models/dream");
const Profile = require("./models/profile");

// import the OpenAI API
const OpenAI = require("openai");

const axios = require("axios");
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
      resource_type: "image",
      type: "upload",
      access_mode: "public",
      secure: true
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
router.post("/dreams", auth.ensureLoggedIn, async (req, res) => {
  try {
    // Get user's profile
    const userId = req.user.googleid;
    const profile = await Profile.findOne({ userId });
    
    const newDream = new Dream({
      userId: userId,
      text: req.body.text,
      imageUrl: req.body.imageUrl,
      date: req.body.date,
      public: req.body.public,
      tags: req.body.tags,
      userProfile: {
        name: profile?.name || "Dreamer",
        picture: "/assets/profilepic.png"
      }
    });

    const savedDream = await newDream.save();

    // Update profile dream counts
    if (profile) {
      profile.dreamCount = (profile.dreamCount || 0) + 1;
      if (req.body.public) {
        profile.publicDreamCount = (profile.publicDreamCount || 0) + 1;
      }
      await profile.save();
    }

    res.send(savedDream);
  } catch (err) {
    console.error("Error saving dream:", err);
    res.status(500).send(err);
  }
});

// Get user's private dreams feed (includes both public and private dreams)
router.get("/get-user-dreams/:userId", auth.ensureLoggedIn, async (req, res) => {
  try {
    const dreams = await Dream.find({ userId: req.params.userId })
      .sort({ date: -1 }); // Sort by date descending
    
    res.json(dreams);
  } catch (error) {
    console.error("Error fetching user dreams:", error);
    res.status(500).json({ error: "Failed to fetch dreams" });
  }
});

// Get public dreams feed (from all users)
router.get("/public-dreams", async (req, res) => {
  try {
    const publicDreams = await Dream.find({ public: true })
      .sort({ date: -1 }) // Sort by date descending
      .limit(50); // Limit to 50 dreams at a time

    res.json(publicDreams);
  } catch (error) {
    console.error("Error fetching public dreams:", error);
    res.status(500).json({ error: "Failed to fetch public dreams" });
  }
});

// Toggle dream privacy
router.post("/toggle-dream-privacy/:dreamId", auth.ensureLoggedIn, async (req, res) => {
  try {
    const dream = await Dream.findById(req.params.dreamId);
    
    if (!dream) {
      return res.status(404).json({ error: "Dream not found" });
    }

    // Only allow the dream owner to toggle privacy
    if (dream.userId !== req.user.googleid) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get user's profile for updating the userProfile field
    const profile = await Profile.findOne({ userId: req.user.googleid });
    
    dream.public = !dream.public;
    if (dream.public) {
      dream.userProfile = {
        name: profile?.name || "Dreamer",
        picture: "/assets/profilepic.png"
      };
    }
    
    await dream.save();

    // Update profile public dream count
    if (profile) {
      if (dream.public) {
        profile.publicDreamCount = (profile.publicDreamCount || 0) + 1;
      } else {
        profile.publicDreamCount = Math.max((profile.publicDreamCount || 0) - 1, 0);
      }
      await profile.save();
    }

    res.json(dream);
  } catch (error) {
    console.error("Error toggling dream privacy:", error);
    res.status(500).json({ error: "Failed to toggle dream privacy" });
  }
});

// Create or update profile
router.post("/profile", auth.ensureLoggedIn, async (req, res) => {
  try {
    const { name, bio, socialLinks, preferences } = req.body;
    const userId = req.user.googleid;  // Get userId from authenticated user

    if (!userId) {
      return res.status(400).json({ error: "Not authenticated" });
    }

    let profile = await Profile.findOne({ userId });
    
    if (!profile) {
      // Create new profile
      profile = new Profile({ userId });
    }

    // Update fields if provided
    if (name !== undefined) profile.name = name;
    if (bio !== undefined) profile.bio = bio;
    if (socialLinks) profile.socialLinks = { ...profile.socialLinks, ...socialLinks };
    if (preferences) profile.preferences = { ...profile.preferences, ...preferences };

    profile.lastActive = new Date();
    await profile.save();

    // Send back the updated profile
    res.json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get profile by userId
router.get("/profile/:userId", async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.params.userId });
    
    if (!profile) {
      // Create default profile if it doesn't exist
      profile = new Profile({ userId: req.params.userId });
      await profile.updateDreamCounts();
      await profile.save();
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Upload profile avatar
router.post("/profile/avatar", async (req, res) => {
  try {
    const { userId, imageData } = req.body;

    if (!userId || !imageData) {
      return res.status(400).json({ error: "userId and imageData are required" });
    }

    // Upload to Cloudinary
    const cloudinary = require("cloudinary").v2;
    const uploadResponse = await cloudinary.uploader.upload(imageData, {
      folder: "dreamscape/avatars",
      resource_type: "image",
      type: "upload",
      access_mode: "public",
      secure: true,
    });

    // Update profile with new avatar URL
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    profile.avatarUrl = uploadResponse.secure_url;
    await profile.save();

    res.json({ avatarUrl: uploadResponse.secure_url });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
