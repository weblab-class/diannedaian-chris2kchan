const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
require("dotenv").config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer for file handling (store in memory before uploading)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ API Route to Upload Image to Cloudinary
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const file = req.file; // Get uploaded file from request
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Upload to Cloudinary
    cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
      if (error) {
        console.error("Cloudinary Upload Failed:", error);
        return res.status(500).json({ error: "Upload failed" });
      }
      res.json({ imageUrl: result.secure_url }); // Return Cloudinary URL
    }).end(file.buffer); // Send file buffer to Cloudinary
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

module.exports = router;
