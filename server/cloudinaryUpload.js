const express = require("express");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ API Route to Upload Image from a URL
router.post("/upload-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "No image URL provided" });
    }

    // Upload the image directly from the provided URL
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "dreamscape", // Optional: Store images in a specific folder
    });

    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error);
    res.status(500).json({ error: "Cloudinary upload failed" });
  }
});

module.exports = router;


