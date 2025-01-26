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
  bio: {
    type: String,
    default: "",
  },
  avatarUrl: {
    type: String,
    default: "/client/dist/assets/default-profile.svg",
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
  },
});

// Update dream counts
ProfileSchema.methods.updateDreamCounts = async function() {
  const Dream = require("./dream");
  const dreams = await Dream.find({ userId: this.userId });
  
  this.dreamCount = dreams.length;
  this.publicDreamCount = dreams.filter(dream => dream.public).length;
};

module.exports = mongoose.model("profile", ProfileSchema);
