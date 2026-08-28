const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },

    age: {
        type:String
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    savedjob:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
    },
    password: {
        type: String,
        default: undefined,
    },

    country: {
        type: String,
        default: "",
        trim: true,
    },

    phone: {
        type: String,
        unique: true,
        sparse: true,
        default: undefined,
        trim: true,
    },

    role: {
    type: String,
    enum: ["client", "freelancer", "admin"],
    },

    image: {
        type: String,
        default: "",
    },

    googleId: {
    type: String,
    unique: true,
    sparse: true,
},

    major: {
        type: String,
        default: "",
        trim: true,
    },
    online:{
        type:Boolean,
        default:false
    },
    lastSeen:{
        type:String
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("User", UserSchema);