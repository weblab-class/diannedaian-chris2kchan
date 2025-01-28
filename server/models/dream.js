const mongoose = require("mongoose");

const DreamSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  text: { type: String, required: true }, // dream log
  date: { 
    type: Date, 
    default: Date.now 
  }, // Timestamp
  tags: [{
    id: String,
    text: String,
    color: String
  }],
  public: { 
    type: Boolean, 
    default: false 
  }, // Whether the dream is public
  imageUrl: { type: String }, // AI-generated image (optional)
  // Add user profile info for public dreams
  userProfile: {
    name: String,
    picture: String
  }
});

module.exports = mongoose.model("Dream", DreamSchema);
