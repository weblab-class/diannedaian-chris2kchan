const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    default: "Dreamer",
  },
  picture: {
    type: String,
    default: "/default-profile.svg",
  },
  name: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "",
  },
  avatarUrl: {
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
  },
});

// Update dream counts
ProfileSchema.methods.updateDreamCounts = async function () {
  const Dream = mongoose.model("dream");
  const totalDreams = await Dream.countDocuments({ userId: this.userId });
  const publicDreams = await Dream.countDocuments({ userId: this.userId, public: true });
  
  this.dreamCount = totalDreams;
  this.publicDreamCount = publicDreams;
  return this.save();
};

module.exports = mongoose.model("profile", ProfileSchema);
