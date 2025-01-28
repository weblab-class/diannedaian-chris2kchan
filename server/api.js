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
const Comment = require("./models/comment"); // Import the Comment model

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

// Update a dream
router.post("/dreams/update", auth.ensureLoggedIn, async (req, res) => {
  try {
    console.log("Updating dream with body:", req.body);
    console.log("Current user:", req.user);
    console.log("Session:", req.session);

    if (!req.user || !req.user.googleid) {
      console.log("❌ No authenticated user found");
      return res.status(401).send({ error: "Please log in to update dreams" });
    }

    const dream = await Dream.findById(req.body._id);
    if (!dream) {
      console.log("Dream not found with id:", req.body._id);
      return res.status(404).send({ error: "Dream not found" });
    }
    
    console.log("Found dream:", dream);
    console.log("Dream userId:", dream.userId);
    console.log("User googleid:", req.user.googleid);

    // Only allow the creator to update the dream
    if (dream.userId !== req.user.googleid) {
      console.log("Authorization failed - userId mismatch");
      return res.status(403).send({ error: "Not authorized to update this dream" });
    }

    // Update the dream fields
    dream.text = req.body.text;
    dream.date = req.body.dateCreated;
    dream.tags = req.body.tags;
    dream.public = Boolean(req.body.public); // Ensure it's a boolean
    dream.imageUrl = req.body.imageUrl;

    console.log("About to save updated dream with fields:", {
      text: dream.text,
      date: dream.date,
      tags: dream.tags,
      public: dream.public,
      imageUrl: dream.imageUrl
    });

    await dream.save();
    console.log("Successfully saved dream with public status:", dream.public);
    res.send(dream);
  } catch (err) {
    console.log("Error updating dream:", err);
    res.status(500).send({ error: err.message });
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

// Get public dreams for gallery
router.get("/public-dreams", async (req, res) => {
  try {
    console.log("Fetching public dreams from database...");
    const dreams = await Dream.find({ public: true })
      .sort({ date: -1 }) // Sort by date descending (newest first)
      .limit(100); // Limit to 100 dreams for performance
    
    console.log(`Found ${dreams.length} public dreams`);
    
    // Get user profiles for all dream creators
    const userProfiles = await Promise.all(
      dreams.map(async (dream) => {
        const profile = await Profile.findOne({ userId: dream.userId });
        return {
          dreamId: dream._id,
          profile: profile || { name: "Anonymous Dreamer", picture: "/assets/profilepic.png" }
        };
      })
    );

    // Combine dreams with their creator's profile
    const dreamsWithProfiles = dreams.map(dream => {
      const userProfile = userProfiles.find(p => p.dreamId.equals(dream._id));
      return {
        ...dream.toObject(),
        userProfile: userProfile.profile
      };
    });
    
    console.log("Sending dreams with profiles:", dreamsWithProfiles);
    res.json(dreamsWithProfiles);
  } catch (error) {
    console.error("Error fetching public dreams:", error);
    res.status(500).json({ error: "Failed to fetch public dreams" });
  }
});

// Get all dreams for a user
router.get("/dreams/:userId", (req, res) => {
  Dream.find({ creator_id: req.params.userId })
    .then((dreams) => {
      res.send(dreams);
    })
    .catch((err) => {
      console.log(`Failed to get dreams for user ${req.params.userId}`, err);
      res.status(500).send(err);
    });
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

// Comment endpoints
router.get("/comments/:dreamId", async (req, res) => {
  try {
    const comments = await Comment.find({ dreamId: req.params.dreamId })
      .populate("userId", ["name", "picture"])
      .sort({ dateCreated: 1 });
    res.send(comments);
  } catch (err) {
    console.error("Error getting comments:", err);
    res.status(500).send({ error: "Could not get comments" });
  }
});

router.post("/comment", auth.ensureLoggedIn, async (req, res) => {
  try {
    // Validate dream exists
    const dream = await Dream.findById(req.body.dreamId);
    if (!dream) {
      return res.status(404).send({ error: "Dream not found" });
    }

    const comment = new Comment({
      userId: req.user._id,
      dreamId: req.body.dreamId,
      content: req.body.content,
      dateCreated: new Date(),
    });

    await comment.save();
    await comment.populate("userId", ["name", "picture"]);
    
    console.log("Created comment:", comment);
    res.send(comment);
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).send({ error: "Could not create comment" });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
