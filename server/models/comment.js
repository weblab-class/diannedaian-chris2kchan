const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  dreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "dream",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  dateCreated: {
    type: Date,
    required: true,
  },
});

// compile model from schema
module.exports = mongoose.model("comment", CommentSchema);
