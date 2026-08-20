const User = require("../models/User");
const Project = require("../models/Project");
const Freelancer = require("../models/Freelancer");

async function getMyContent(req, res) {
    try {
        const user = await User.findById(req.userId).select("role");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.role === "client") {
            const projects = await Project.find({ clientId: req.userId })
                .sort({ createdAt: -1 });
            return res.status(200).json({ success: true, role: "client", projects });
        }

        if (user.role === "freelancer") {
            const freelancer = await Freelancer.findById(req.userId).select("portfolio");
            return res.status(200).json({
                success: true,
                role: "freelancer",
                works: freelancer?.portfolio || [],
            });
        }

        return res.status(403).json({ success: false, message: "This account has no project or work content" });
    } catch (error) {
        console.error("Get my content error:", error);
        res.status(500).json({ success: false, message: "Failed to load your content" });
    }
}

module.exports = { getMyContent };