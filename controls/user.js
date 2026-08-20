const User = require("../models/User");

async function updateuser(req, res) {
    try {
        const allowed = ["fullName","country", "phone" ,"age","email"];
        const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
        const user = await User.findOneAndUpdate(
                {_id :req.userId},
                updates,
                {
                    returnDocument: "after",
                    runValidators: true
                }
            ).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
}

async function updateProfileImage(req, res) {
    try {
        const image = req.body.image ?? req.body.imageUrl;

        if (typeof image !== "string" || !image.trim()) {
            return res.status(400).json({
                success: false,
                message: "A Cloudinary image URL is required"
            });
        }

        const imageUrl = image.trim();
        const parsedUrl = new URL(imageUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({
                success: false,
                message: "Image URL must use http or https"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { image: imageUrl },
            {returnDocument: "after", runValidators: true}
        ).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Update profile image error:", error);
        return res.status(400).json({
            success: false,
            message: "Please provide a valid image URL"
        });
    }
}

module.exports = { updateuser, updateProfileImage };