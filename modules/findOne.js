const mongoose = require("mongoose");
const Books = require("../schema/books");
const Audios = require("../schema/audios");
const AudioParts = require("../schema/audioParts");

const collections = {
    books: Books,
    audios: Audios,
    audioParts: AudioParts
}

module.exports = async (collection, key, id) => {
    try {
        await mongoose.connect(process.env.MONGO_URL);

        console.log("Connected to database");

        const response = await collections[collection].findOne({ [key]: id });

        console.log(response)
        return response;
    } catch (error) {
        console.error("Error connecting to database", error)
        return -1;
    }
}