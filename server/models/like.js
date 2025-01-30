const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema({
  userId: String,
  dreamId: String,
  dateCreated: { type: Date, default: Date.now },
});

// compile model from schema
module.exports = mongoose.model("like", LikeSchema);
