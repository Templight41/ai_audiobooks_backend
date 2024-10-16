const mongoose = require("mongoose");

const AudioParts = new mongoose.Schema({
    audioPartId: { type: String, unique: true },
    part: { type: Number, unique: false },
    audioId: { type: String, unique: false },
    audioPartUrl: { type: String, unique: false },
})

module.exports = mongoose.model("AudioParts", AudioParts)