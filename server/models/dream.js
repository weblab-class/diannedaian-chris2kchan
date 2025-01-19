const mongoose = require("mongoose");

const DreamSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    date: {type: Date, default: Date.now},
    content: {type: String, required: true},
    interpretation: {type: String},
    imageUrl: {type: [String]},
    });


module.exports = mongoose.model("Dream", DreamSchema);
