const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
    },
    category: {
        type: String,
        default: "",
        trim: true,
    },
    skills: [{
        type: String,
        trim: true,
    }],
    budget: {
        type: Number,
        min: 0,
        default: 0,
    },
    deadline: {
        type: Date,
    },
    status: {
        type: String,
        enum: ["open", "in_progress", "completed", "cancelled"],
        default: "open",
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
}, {
    timestamps: true,
});

ProjectSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Project", ProjectSchema);