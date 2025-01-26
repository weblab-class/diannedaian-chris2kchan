const mongoose = require("mongoose");

const DreamSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  text: { type: String, required: true }, // dream log
  imageUrl: { type: String }, // AI-generated image (optional)
  date: { 
    type: Date, 
    default: Date.now 
  }, // Timestamp
  public: { 
    type: Boolean, 
    default: false 
  }, // Whether the dream is public
  tags: [{
    id: String,
    text: String,
    color: String
  }],
  // Add user profile info for public dreams
  userProfile: {
    name: String,
    picture: String
  }
});

module.exports = mongoose.model("Dream", DreamSchema);
