const mongoose = require("mongoose");

const Audios = new mongoose.Schema({
    audioId: { type: String, unique: true },
    pageStart: { type: Number, unique: false },
    pageEnd: { type: Number, unique: false },
    bookId: { type: String, unique: false },
    audioUrl: { type: String, unique: false },
})

// module.exports = Tasks
module.exports = mongoose.model("Audios", Audios)