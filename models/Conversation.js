const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    lastMessage: {
        type: String,
        default: "",
        maxlength: 5000,
    },
    lastMessageAt: {
        type: Date,
    },
}, { timestamps: true });

ConversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);