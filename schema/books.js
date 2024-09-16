const mongoose = require("mongoose");

const Books = new mongoose.Schema({
    bookId: { type: String, unique: true },
    title: { type: String, unique: false },
    author: { type: String, unique: false },
    fileName: { type: String, unique: false },
    url: { type: String, unique: false },
})

// module.exports = Tasks
module.exports = mongoose.model("Books", Books)