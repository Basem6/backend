const mongoose = require("mongoose");
const User = require("./User");

const FreelancerSchema = new mongoose.Schema({
    skills: [{ type: String, trim: true }],
    hourlyRate: { type: Number, min: 0 },
    bio: { type: String, default: "", trim: true, maxlength: 2000 },
    portfolio: [{
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        category: { type: String, default: "", trim: true },
        tags: [{ type: String, trim: true }],
        coverImage: { type: String, default: "" },
        liveUrl: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
    }],
});

module.exports = User.discriminator("Freelancer", FreelancerSchema);