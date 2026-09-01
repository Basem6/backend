const mongoose = require("mongoose");
const proposalSchema = new mongoose.Schema(
{
    project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
    },

    freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Freelancer",
    required: true,
    },
    client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    },
    coverLetter: {
    type: String,
    required: true,
    trim: true,
    },

    bidAmount: {
    type: Number,
    required: true,
    },

    deliveryTime: {
    type: Number,
    required: true,
    },

    status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "withdrawn"],
    default: "pending",
    },
},
{ timestamps: true }
);

proposalSchema.index(
{ project: 1, freelancer: 1 },
{
    unique: true,
    partialFilterExpression: {
    status: {
        $in: ["pending", "accepted"],
    },
    },
}
);

module.exports = mongoose.model("Proposal", proposalSchema);``