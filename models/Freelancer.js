const mongoose = require("mongoose");

const User = require("./User");

const FreelancerSchema = new mongoose.Schema({

    specialty: {
        type: String,
        trim: true,
        default: "",
    },

    skills: [
        {
            type: String,
            trim: true,
        }
    ],

    hourlyRate: {
        type: Number,
        min: 0,
    },

    bio: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
    },

    // Languages
    languages: [
        {
            language: {
                type: String,
                trim: true,
            
            },

            proficiency: {
                type: String,
                enum: [
                    "Basic",
                    "Conversational",
                    "Fluent",
                    "Native",
                    "Professional"
                ],
                default: "Conversational",
            },
        }
    ],

    // Education
    education: [
        {
            school: {
                type: String,
                trim: true,
                required: true,
            },

            degree: {
                type: String,
                trim: true,
                default: "",
            },

            fieldOfStudy: {
                type: String,
                trim: true,
                default: "",
            },

            startYear: {
                type: Number,
                min: 1900,
                max: 2100,
            },

            endYear: {
                type: Number,
                min: 1900,
                max: 2100,
            },

            description: {
                type: String,
                trim: true,
                default: "",
            },
        }
    ],

    // Work Experience
    experience: [
        {
            title: {
                type: String,
                trim: true,
                required: true,
            },

            company: {
                type: String,
                trim: true,
                default: "",
            },

            location: {
                type: String,
                trim: true,
                default: "",
            },

            employmentType: {
                type: String,
                enum: [
                    "Full-time",
                    "Part-time",
                    "Contract",
                    "Freelance",
                    "Internship"
                ],
                default: "Freelance",
            },

            startDate: {
                type: Date,
            },

            endDate: {
                type: Date,
            },

            currentlyWorking: {
                type: Boolean,
                default: false,
            },

            description: {
                type: String,
                trim: true,
                default: "",
            },
        }
    ],

    portfolio: [
        {
            title: {
                type: String,
                required: true,
                trim: true,
            },

            description: {
                type: String,
                default: "",
                trim: true,
            },

            category: {
                type: String,
                default: "",
                trim: true,
            },

            tags: [
                {
                    type: String,
                    trim: true,
                }
            ],

            coverImage: {
                type: String,
                default: "",
            },

            liveUrl: {
                type: String,
                default: "",
            },

            createdAt: {
                type: Date,
                default: Date.now,
            },
        }
    ],

});

module.exports = User.discriminator("Freelancer", FreelancerSchema);