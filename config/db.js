const mongoose = require("mongoose");
const connectDB = async () => {
    try {
<<<<<<< HEAD
        await mongoose.connect(process.env.MONGODB_URI);
=======
        await mongoose.connect(process.env.MONGO_URI);
>>>>>>> 852ca0189d3ed84152977a398779d53e742dcee7

        console.log("Database Connected");
    } catch (err) {
        console.log(err);
    }
}

module.exports = connectDB;