const Client = require("../models/Client");

async function getClient(req, res) {
    try {
        const client = await Client.findById(req.params.id || req.userId).select("-password");
        if (!client) return res.status(404).json({ success: false, message: "Client not found" });
        res.status(200).json({ success: true, client });
    } catch (error) {
        if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid client id" });
        console.error("Get client error:", error);
        res.status(500).json({ success: false, message: "Failed to load client" });
    }
}

module.exports = { getClient };