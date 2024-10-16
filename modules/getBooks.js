const mongoose = require("mongoose");
const Books = require("../schema/books");

module.exports = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);

        console.log("Connected to database");

        const response = await Books.find({});

        console.log(response)
        return response

    } catch(error) {
        console.error("Error connecting to database", error)
    }
}