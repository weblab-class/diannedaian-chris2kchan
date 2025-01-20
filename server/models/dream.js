const mongoose = require("mongoose");

const DreamSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    text: { type: String, required: true }, // dream log
    imageUrl: { type: String }, // AI-generated image (optional)
    date: { type: Date, default: Date.now }, // Timestamp
    public: { type: Boolean, default: false } // Whether the dream is public
    });


module.exports = mongoose.model("Dream", DreamSchema);
