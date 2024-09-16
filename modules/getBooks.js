const mongoose = require("mongoose");
const books = require("../schema/books");

module.exports = async () => {
    try {
        mongoose.connect(process.env.MONGO_URL);

        console.log("Connected to database");

        const response = await books.find({});

        console.log(response)
        return response

    } catch(error) {
        console.error("Error connecting to database", error)
    }
}