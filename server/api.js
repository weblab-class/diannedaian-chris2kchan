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
const socketManager = require("./server-socket");
const Profile = require("./models/profile");
const Dream = require("./models/dream");
const Comment = require("./models/comment");
const OpenAI = require("openai");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OpenAI API key in environment variables!");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = express.Router();

// import models so we can interact with the database
const User = require("./models/user");
const Like = require("./models/like");

// import the OpenAI API
const axios = require("axios");

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
      response_format: "url",
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
      secure: true,
    });

    console.log("✅ Uploaded to Cloudinary:", uploadResponse.secure_url);

    res.json({
      imageUrl: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    });
  } catch (error) {
    console.error("Error generating/uploading image:", error);
    res.status(500).json({ error: error.message });
  }
});

// Saving user dreams
router.post("/dreams", auth.ensureLoggedIn, async (req, res) => {
  try {
    console.log("📝 Starting dream save operation");
    console.log("Session state:", req.session);
    console.log("User state:", req.user);
    console.log("Received dream data:", req.body);

    // Get user's profile
    const userId = req.user?.googleid;
    if (!userId) {
      console.error("❌ No user ID found in request");
      return res.status(401).json({ error: "User not properly authenticated" });
    }
    
    console.log("Looking up profile for userId:", userId);
    const profile = await Profile.findOne({ userId });
    console.log("Found profile:", profile);

    if (!profile) {
      console.warn("⚠️ No profile found for user, creating default profile");
    }

    const newDream = new Dream({
      userId: userId,
      text: req.body.text,
      imageUrl: req.body.imageUrl,
      date: req.body.date || new Date(),
      public: req.body.public,
      tags: req.body.tags,
      userProfile: {
        name: profile?.name || "Dreamer",
        picture: profile?.picture || "/assets/profilepic.png",
      },
    });

    console.log("Created new dream object:", newDream);

    const savedDream = await newDream.save();
    console.log("✅ Successfully saved dream:", savedDream);

    // Update profile dream counts using the updateDreamCounts method
    if (profile) {
      await profile.updateDreamCounts();
      await profile.save();
      console.log("✅ Updated profile counts");
    }

    res.send(savedDream);
  } catch (err) {
    console.error("❌ Error saving dream:", {
      error: err,
      name: err.name,
      message: err.message,
      stack: err.stack,
      body: req.body,
      session: req.session,
      user: req.user,
      headers: req.headers
    });
    res.status(500).json({ error: err.message });
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
      imageUrl: dream.imageUrl,
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
    const dreams = await Dream.find({ userId: req.params.userId }).sort({ date: -1 }); // Sort by date descending

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
          profile: profile || { name: "Anonymous Dreamer", picture: "/assets/profilepic.png" },
        };
      })
    );

    // Combine dreams with their creator's profile
    const dreamsWithProfiles = dreams.map((dream) => {
      const userProfile = userProfiles.find((p) => p.dreamId.equals(dream._id));
      return {
        ...dream.toObject(),
        creator: {
          _id: dream.userId,
          name: userProfile.profile.name,
          picture: userProfile.profile.picture
        }
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

// Get user's public dreams
router.get("/dreams/public/:userId", async (req, res) => {
  try {
    const dreams = await Dream.find({
      userId: req.params.userId,
      public: true,
    }).sort({ date: -1 });

    // Get profile for the creator
    const profile = await Profile.findOne({ userId: req.params.userId });
    
    // Add creator information to each dream
    const dreamsWithCreator = dreams.map(dream => ({
      ...dream.toObject(),
      creator: {
        _id: req.params.userId,
        name: profile?.name || "Anonymous Dreamer",
        picture: profile?.picture || "/assets/profilepic.png"
      }
    }));

    res.json(dreamsWithCreator);
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
        picture: "/assets/profilepic.png",
      };
    }

    await dream.save();

    // Update profile public dream count using the updateDreamCounts method
    if (profile) {
      await profile.updateDreamCounts();
      await profile.save();
    }

    res.json(dream);
  } catch (error) {
    console.error("Error toggling dream privacy:", error);
    res.status(500).json({ error: "Failed to toggle dream privacy" });
  }
});

// Update user profile
router.post("/profile", auth.ensureLoggedIn, async (req, res) => {
  try {
    const { name, bio, picture } = req.body;
    const userId = req.user.googleid; // Get userId from authenticated user

    if (!userId) {
      return res.status(400).json({ error: "Not authenticated" });
    }

    let profile = await Profile.findOne({ userId });

    if (!profile) {
      // Create new profile
      profile = new Profile({ userId });
    }

    // Update profile fields
    if (name) profile.name = name;
    if (bio) profile.bio = bio;
    if (picture) profile.picture = picture;

    await profile.save();

    // Send back the complete profile
    res.json({
      userId: profile.userId,
      name: profile.name,
      bio: profile.bio,
      picture: profile.picture,
      totalDreams: profile.totalDreams,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Could not update profile" });
  }
});

// Update profile preferences
router.post("/profile/update-preferences", auth.ensureLoggedIn, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.googleid });
    
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    profile.preferences = {
      ...profile.preferences,
      ...req.body.preferences,
    };

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// Get user profile by ID
router.get("/profile/:userId", async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
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

// Upload profile picture
router.post(
  "/upload-profile-picture",
  auth.ensureLoggedIn,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      console.log("Received file:", req.file);

      // Configure cloudinary
      const cloudinary = require("cloudinary").v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile-pictures",
        resource_type: "image",
        type: "upload",
        access_mode: "public",
        secure: true,
      });

      console.log("Cloudinary upload response:", uploadResponse);

      // Clean up the temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });

      // Update user's profile with new picture URL
      const profile = await Profile.findOne({ userId: req.user.googleid });
      if (profile) {
        profile.picture = uploadResponse.secure_url;
        await profile.save();
      }

      res.json({
        imageUrl: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      // Clean up the temporary file in case of error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);

// Comment endpoints
router.get("/comments/:dreamId", async (req, res) => {
  try {
    const comments = await Comment.find({ dreamId: req.params.dreamId })
      .populate({
        path: "userId",
        select: ["googleid"],
      })
      .sort({ dateCreated: 1 });

    // Get profiles for all comment authors
    const commentsWithProfiles = await Promise.all(
      comments.map(async (comment) => {
        const profile = await Profile.findOne({ userId: comment.userId.googleid });
        return {
          ...comment.toObject(),
          userProfile: profile || { name: "Anonymous Dreamer", picture: "/assets/profilepic.png" },
        };
      })
    );

    res.send(commentsWithProfiles);
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
    
    // Get the user's profile
    const profile = await Profile.findOne({ userId: req.user.googleid });
    
    // Send back comment with profile info
    res.send({
      ...comment.toObject(),
      userProfile: profile || { name: "Anonymous Dreamer", picture: "/assets/profilepic.png" },
    });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).send({ error: "Could not create comment" });
  }
});

// Get dream counts for a user
router.get("/dreams/count/:userId", async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    // Update the counts before sending
    await profile.updateDreamCounts();
    await profile.save();
    
    res.json({
      totalDreams: profile.dreamCount,
      publicDreams: profile.publicDreamCount
    });
  } catch (error) {
    console.error("Error fetching dream counts:", error);
    res.status(500).json({ error: "Failed to fetch dream counts" });
  }
});

// Delete a dream
router.delete("/dreams/:dreamId", auth.ensureLoggedIn, async (req, res) => {
  try {
    console.log("Delete request received for dreamId:", req.params.dreamId);
    console.log("Current user:", req.user);
    
    if (!req.user || !req.user.googleid) {
      console.log("No authenticated user found");
      return res.status(401).send({ error: "Please log in to delete dreams" });
    }
    
    const dream = await Dream.findById(req.params.dreamId);
    if (!dream) {
      console.log("Dream not found with id:", req.params.dreamId);
      return res.status(404).send({ error: "Dream not found" });
    }
    
    console.log("Found dream:", dream);
    console.log("Dream userId:", dream.userId);
    console.log("User googleid:", req.user.googleid);
    
    // Only allow the creator to delete the dream
    if (dream.userId !== req.user.googleid) {
      console.log("Authorization failed - userId mismatch");
      return res.status(403).send({ error: "Not authorized to delete this dream" });
    }
    
    await Dream.findByIdAndDelete(req.params.dreamId);
    console.log("Successfully deleted dream");
    
    // Update profile dream counts using the updateDreamCounts method
    const profile = await Profile.findOne({ userId: req.user.googleid });
    if (profile) {
      await profile.updateDreamCounts();
      await profile.save();
      console.log("Updated profile counts");
    }
    
    res.send({ success: true });
  } catch (err) {
    console.error("Error deleting dream:", {
      error: err,
      name: err.name,
      message: err.message,
      stack: err.stack,
      dreamId: req.params.dreamId,
      session: req.session,
      user: req.user,
      headers: req.headers
    });
    res.status(500).send({ error: err.message });
  }
});

// Force recalculation of dream counts
router.post("/profile/recalculate-counts", auth.ensureLoggedIn, async (req, res) => {
  try {
    console.log("Recalculating dream counts for user:", req.user.googleid);
    const profile = await Profile.findOne({ userId: req.user.googleid });
    
    if (!profile) {
      // Create profile if it doesn't exist
      const newProfile = new Profile({
        userId: req.user.googleid,
        name: req.user.name,
        picture: req.user.picture,
      });
      await newProfile.updateDreamCounts();
      await newProfile.save();
      return res.json({
        totalDreams: newProfile.dreamCount,
        publicDreams: newProfile.publicDreamCount
      });
    }
    
    await profile.updateDreamCounts();
    await profile.save();
    
    res.json({
      totalDreams: profile.dreamCount,
      publicDreams: profile.publicDreamCount
    });
  } catch (error) {
    console.error("Error recalculating dream counts:", error);
    res.status(500).json({ error: "Failed to recalculate dream counts" });
  }
});

// Like routes
router.post("/like", auth.ensureLoggedIn, async (req, res) => {
  try {
    const { dreamId } = req.body;
    const userId = req.user._id;

    // Check if like already exists
    const existingLike = await Like.findOne({ userId, dreamId });
    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      res.send({ liked: false });
    } else {
      const newLike = new Like({ userId, dreamId });
      await newLike.save();
      res.send({ liked: true });
    }
  } catch (err) {
    console.error("Error in like route:", err);
    res.status(500).send({ error: "Internal server error" });
  }
});

router.get("/likes/:dreamId", auth.ensureLoggedIn, async (req, res) => {
  try {
    const likes = await Like.find({ dreamId: req.params.dreamId });
    const userLiked = likes.some((like) => like.userId === req.user._id);
    res.send({ likes: likes.length, userLiked });
  } catch (err) {
    console.error("Error in get likes route:", err);
    res.status(500).send({ error: "Internal server error" });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
