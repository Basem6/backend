const mongoose = require("mongoose");
const User = require("./User");

const ClientSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: "",
        trim: true,
    },
    budgetRange: {
        type: String,
        default: "",
        trim: true,
    },
    postedProjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
    }],
});

module.exports = User.discriminator("Client", ClientSchema);