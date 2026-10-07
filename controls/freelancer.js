const Freelancer = require("../models/Freelancer");
const cleanStringArray =require("../utils/NoRepeat")
async function listFreelancers(req, res) {
    try {
        const freelancers = await Freelancer.find().select("-password")
        res.status(200).json({ success: true, freelancers });
    } catch (error) {
        console.error("List freelancers error:", error);
        res.status(500).json({ success: false, message: "Failed to load freelancers" });
    }
}

async function listMyWorks(req, res) {
    try {
        const freelancer = await Freelancer.findById(req.userId).select("portfolio");
        if (!freelancer) return res.status(404).json({ success: false, message: "Freelancer not found" });
        res.status(200).json({ success: true, works: freelancer.portfolio || [] });
    } catch (error) {
        console.error("List my works error:", error);
        res.status(500).json({ success: false, message: "Failed to load your works" });
    }
}

async function getFreelancer(req, res) {
    try {
        const freelancer = await Freelancer.findById(req.params.id).select("-password");
        if (!freelancer) return res.status(404).json({ success: false, message: "Freelancer not found" });
        res.status(200).json({ success: true, freelancer});
    } catch (error) {
        if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid freelancer id" });
        console.error("Get freelancer error:", error);
        res.status(500).json({ success: false, message: "Failed to load freelancer" });
    }
}

async function updateFreelancer(req, res) {
    try {
        const allowed = [
            "skills",
            "specialty",
            "major",
            "bio",
            "hourlyRate",
            "languages",
            "education",
            "experience",
            "portfolio"
        ];

        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) =>
                allowed.includes(key)
            )
        );

        const freelancer = await Freelancer.findOneAndUpdate(
        {_id :req.userId},
        updates,
        {
            returnDocument: "after",
            runValidators: true
        }
    ).select("-password");
        if (!freelancer) {
            return res.status(404).json({
                success: false,
                message: "Freelancer not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Freelancer updated successfully",
            freelancer
        });

    } catch (error) {
        console.error("Update freelancer error:", error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function addWork(req, res) {
    try {
        const { title, description = "", category = "", skills = [], coverImage = "", liveUrl = "" } = req.body;
        if (!title?.trim()) return res.status(400).json({ success: false, message: "Title is required" });
        const freelancer = await Freelancer.findByIdAndUpdate(
            req.userId,
            { $push: { portfolio: { title: title.trim(), description, category, skills, coverImage, liveUrl } } },
            { new: true, runValidators: true }
        ).select("-password");
        if (!freelancer) return res.status(404).json({ success: false, message: "Freelancer not found" });
        res.status(201).json({ success: true, freelancer });
    } catch (error) {
        console.error("Add work error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
}

async function deleteWork(req, res) {
    try {
        const freelancer = await Freelancer.findOneAndUpdate(
            { _id: req.userId, "portfolio._id": req.params.id },
            { $pull: { portfolio: { _id: req.params.id } } },
            { new: true }
        ).select("-password");
        if (!freelancer) return res.status(404).json({ success: false, message: "Work not found" });
        res.status(200).json({ success: true, freelancer });
    } catch (error) {
        console.error("Delete work error:", error);
        res.status(500).json({ success: false, message: "Failed to delete work" });
    }
}

async function updateWork(req, res) {
    try {
        const allowedFields = ["title", "description" ,"coverImage", "liveUrl"];

        const updates = {};

        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updates[`portfolio.$.${key}`] = req.body[key];
            }
        }
        for (const field of ["skills"]) {
            if (req.body[field] !== undefined) {
                if (!Array.isArray(req.body[field])) {
                    return res
                        .status(400)
                        .json({ success: false, message: `${field} must be an array` });
                }

                updates[`portfolio.$.${field}`] = cleanStringArray(req.body[field]);
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields to update" });
        }

        const freelancer = await Freelancer.findOneAndUpdate(
            { _id: req.userId, "portfolio._id": req.params.id },
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!freelancer) {
            return res.status(404).json({ success: false, message: "Work not found" });
        }

        res.status(200).json({ success: true, freelancer });
    } catch (error) {
    console.error("Update work error:", error);

    return res.status(500).json({
        success: false,
        message: error.message,
        error: error.name,
    });
}
    
}
module.exports = { listFreelancers, listMyWorks, getFreelancer, updateFreelancer,updateWork ,addWork, deleteWork };