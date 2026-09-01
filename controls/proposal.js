const Project = require("../models/Project");
const Freelancer = require("../models/Freelancer");
const Client = require("../models/Client");
const Proposal = require("../models/Proposal");
const addProposal = async (req, res) => {
        try {
        const { id } = req.params;
        const { coverLetter, bidAmount, deliveryTime } = req.body;
        const freelancerId = req.userId;
        // Validation
        if (!coverLetter || !bidAmount || !deliveryTime) {
        return res.status(400).json({ message: "All fields are required" });
        }
    
        if (bidAmount <= 0) {
        return res.status(400).json({ message: "Bid amount must be positive" });
        }
    
        if (deliveryTime <= 0) {
        return res.status(400).json({ message: "Delivery time must be positive" });
        }
    
        // Check if project exists
        const project = await Project.findById(id);
        if (!project) {
        return res.status(404).json({ message: "Project not found" });
        }
    
        // Check if freelancer exists
        const freelancer = await Freelancer.findById(freelancerId);
        if (!freelancer) {
        return res.status(404).json({ message: "Freelancer profile not found" });
        }
    
        // Check if freelancer already has a proposal for this project
        const existingProposal = await Proposal.findOne({
        project: id,
        freelancer: freelancerId,
        status: {
            $in: ["pending", "accepted"],
        },
        });

        if (existingProposal) {
        return res.status(409).json({
            message: "You already have an active proposal for this project",
            proposalId: existingProposal._id,
        });
        }
    
        // Create proposal
        const newProposal = new Proposal({
        project: id,
        freelancer: freelancerId,
        client: project.clientId,
        coverLetter,
        bidAmount,
        deliveryTime,
        });
    
        await newProposal.save();
    
        // Populate references before returning
        await newProposal.populate([
        { path: "project", select: "title budget" },
        { path: "freelancer", select: "fullName image  rating country major" },
        ]);
    
        res.status(201).json({
        message: "Proposal created successfully",
        proposal: newProposal,
        });
        } catch (error) {
        console.error("Error creating proposal:", error);
        res.status(500).json({ message: "Server error", error: error.message });
        }
};
const deleteProposal = async (req, res) => {
        try {
        const { id } = req.params;
        const freelancerId = req.userId;
        const freelancer = await Freelancer.findById(freelancerId);
        if (!freelancer) {
        return res.status(404).json({ message: "Freelancer profile not found" });
        }
        const proposal = await Proposal.findById(id);
        if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
        }
    
        // Check if proposal belongs to authenticated freelancer
        if (proposal.freelancer.toString() !== freelancerId.toString()) {
        return res.status(403).json({ message: "Not authorized to withdraw this proposal" });
        }
    
        // Cannot withdraw accepted proposals
        if (proposal.status === "accepted") {
        return res.status(400).json({
            message: "Cannot withdraw an accepted proposal",
        });
        }
        // Cannot withdraw already rejected proposals
        if (proposal.status === "rejected") {
        return res.status(400).json({
            message: "Proposal is already rejected",
        });
        }
    
        proposal.status = "withdrawn";
        await proposal.save();
    
        res.json({
        message: "Proposal withdrawn successfully",
        proposal,
        });
    } catch (error) {
        console.error("Error withdrawing proposal:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
const getProposals = async (req, res) => {
        try {
        const { id } = req.params;
        const projectId = id;
        const { status } = req.query;
    
        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
        return res.status(404).json({ message: "Project not found" });
        }
    
        // Build filter
        const filter = { project: projectId };
        if (status) {
        filter.status = status;
        }
    
        const proposals = await Proposal.find({
        project: projectId,
        status: { $ne: "withdrawn" },
        })
        .populate("freelancer", "fullName image rating country major")
        .sort({ createdAt: -1 });
        res.json({
        count: proposals.length,
        proposals,
        });
    } catch (error) {
        console.error("Error fetching proposals:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
const detailsProposal = async (req, res) => {
        try {
        const { proposalId } = req.params;

        const proposal = await Proposal.findById(proposalId).populate([
        { path: "project", select: "title description budget deadline" },
        { path: "freelancer", select: "name rating portfolio skills about" },
        ]);

        if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
        }

        res.json(proposal);
    } catch (error) {
        console.error("Error fetching proposal:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
const myproposals = async (req, res) => {
    try {
    const freelancerId = req.userId;
    const freelancer = await Freelancer.findById(freelancerId);
    if (!freelancer) {
    return res.status(404).json({ message: "Freelancer profile not found" });
    }
    const { status } = req.query;
    
        const filter = { freelancer: freelancerId };
        if (status) {
        filter.status = status;
        }
    
        const proposals = await Proposal.find(filter)
        .populate("project", "title budget  description clientId  createdAt status")
        .populate("client", "fullName image")
        .sort({ createdAt: -1 });
    
        res.json({
        count: proposals.length,
        proposals,
        });
    } catch (error) {
        console.error("Error fetching freelancer proposals:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
const proposalstatus = async (req, res) => {
        try {
        const { proposalId } = req.params;
        const clientId = req.userId;
        const client = await Client.findById(clientId);
        if (!client) {
        return res.status(404).json({ message: "client profile not found" });
        }
        const { status } = req.body;
    
        if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'" });
        }
    
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
        }
    
        // Check if project belongs to authenticated client
        const project = await Project.findById(proposal.project);
        if (project.client.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: "Not authorized to update this proposal" });
        }
    
        // Only pending proposals can be accepted/rejected
        if (proposal.status !== "pending") {
        return res.status(400).json({
            message: `Cannot update proposal with status '${proposal.status}'`,
        });
        }
    
        proposal.status = status;
        await proposal.save();
    
        await proposal.populate([
        { path: "project", select: "title" },
        { path: "freelancer", select: "name" },
        ]);
    
        res.json({
        message: `Proposal ${status} successfully`,
        proposal,
        });
    } catch (error) {
        console.error("Error updating proposal status:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
module.exports = {addProposal , getProposals , detailsProposal , deleteProposal , myproposals , proposalstatus};