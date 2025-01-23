const express = require("express");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

// Cloudinary Configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Missing Cloudinary credentials in environment variables!");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ✅ API Route to Upload Image
router.post("/upload-image", async (req, res) => {
  try {
    const { imageData, format } = req.body;
    
    // Input validation
    if (!imageData) {
      return res.status(400).json({ error: "No image data provided" });
    }

    console.log("📸 Attempting to upload image to Cloudinary...");

    let uploadResult;
    if (format === "base64") {
      // Upload base64 data directly
      uploadResult = await cloudinary.uploader.upload(`data:image/png;base64,${imageData}`, {
        folder: "dreamscape",
        timeout: 60000, // 60 second timeout
      });
    } else {
      // If it's already a Cloudinary URL, return as is
      if (imageData.includes("cloudinary.com")) {
        console.log("✅ URL is already on Cloudinary, returning as is");
        return res.json({ imageUrl: imageData });
      }
      
      // Upload from URL (fallback)
      if (!isValidUrl(imageData)) {
        return res.status(400).json({ error: "Invalid image URL format" });
      }
      uploadResult = await cloudinary.uploader.upload(imageData, {
        folder: "dreamscape",
        timeout: 60000,
      });
    }

    console.log("✅ Successfully uploaded to Cloudinary:", uploadResult.secure_url);
    res.json({ 
      imageUrl: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      resource_type: uploadResult.resource_type 
    });
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error.message);
    // Send more detailed error message
    res.status(500).json({ 
      error: "Cloudinary upload failed", 
      details: error.message,
      code: error.http_code || 500
    });
  }
});

module.exports = router;
