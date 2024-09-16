const mongoose = require("mongoose");

const Users = new mongoose.Schema({
    userId: { type: String, unique: true },
    name: { type: String, unique: false },
    email: { type: String, unique: true },
    password: { type: String, unique: false },
})

module.exports = mongoose.model("Users", Users)