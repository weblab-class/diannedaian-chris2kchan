const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    default: "Dreamer",
  },
  picture: {
    type: String,
    default: "/assets/profilepic.png",
  },
  bio: {
    type: String,
    default: "",
  },
  dreamCount: {
    type: Number,
    default: 0,
  },
  publicDreamCount: {
    type: Number,
    default: 0,
  },
  dateJoined: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  // Optional social links
  socialLinks: {
    website: String,
    twitter: String,
    instagram: String,
  },
  // User preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    displayFullName: {
      type: Boolean,
      default: true,
    },
    hasSeenGuide: {
      type: Boolean,
      default: false,
    },
  },
});

// Update dream counts
ProfileSchema.methods.updateDreamCounts = async function () {
  try {
    const Dream = require("./dream");
    console.log("Updating dream counts for userId:", this.userId);
    
    const dreams = await Dream.find({ userId: this.userId });
    console.log("Found dreams:", dreams.length);
    
    this.dreamCount = dreams.length;
    this.publicDreamCount = dreams.filter((dream) => dream.public).length;
    
    console.log("Updated counts:", {
      total: this.dreamCount,
      public: this.publicDreamCount
    });
  } catch (error) {
    console.error("Error updating dream counts:", error);
    throw error;
  }
};

module.exports = mongoose.model("profile", ProfileSchema);
