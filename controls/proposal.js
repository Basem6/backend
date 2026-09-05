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
        if (
        typeof coverLetter !== "string" ||
        !coverLetter.trim() ||
        bidAmount === undefined ||
        deliveryTime === undefined
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }
    
        if (
        typeof bidAmount !== "number" ||
        !Number.isFinite(bidAmount) ||
        bidAmount <= 0
    ) {
        return res.status(400).json({
            message: "Bid amount must be positive",
        });
    }

    if (
        typeof deliveryTime !== "number" ||
        !Number.isFinite(deliveryTime) ||
        deliveryTime <= 0
    ) {
        return res.status(400).json({
            message: "Delivery time must be positive",
        });
    }
    
        // Check if project exists
        const project = await Project.findById(id);
        if (!project) {
        return res.status(404).json({ message: "Project not found" });
        }
        if (project.status !== "open") {
        return res.status(400).json({
            message: "This project is no longer open for proposals",
        });
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
        coverLetter: coverLetter.trim(),
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
const updateProposal = async (req, res) => {
    try {
        const { id } = req.params;
        const freelancerId = req.userId;
        const { coverLetter, bidAmount, deliveryTime } = req.body;

        if (coverLetter === undefined && bidAmount === undefined && deliveryTime === undefined) {
            return res.status(400).json({ message: "At least one proposal field is required" });
        }

        const freelancer = await Freelancer.findById(freelancerId);
        if (!freelancer) {
            return res.status(404).json({ message: "Freelancer profile not found" });
        }

        const proposal = await Proposal.findById(id);
        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        if (proposal.freelancer.toString() !== freelancerId.toString()) {
            return res.status(403).json({ message: "Not authorized to edit this proposal" });
        }

        if (proposal.status !== "pending") {
            return res.status(400).json({
                message: `Cannot edit proposal with status '${proposal.status}'`,
            });
        }

        if (coverLetter !== undefined) {
            if (typeof coverLetter !== "string" || !coverLetter.trim()) {
                return res.status(400).json({ message: "Cover letter cannot be empty" });
            }
            proposal.coverLetter = coverLetter.trim();
        }

        if (bidAmount !== undefined) {
            if (typeof bidAmount !== "number" || !Number.isFinite(bidAmount) || bidAmount <= 0) {
                return res.status(400).json({ message: "Bid amount must be positive" });
            }
            proposal.bidAmount = bidAmount;
        }

        if (deliveryTime !== undefined) {
            if (typeof deliveryTime !== "number" || !Number.isFinite(deliveryTime) || deliveryTime <= 0) {
                return res.status(400).json({ message: "Delivery time must be positive" });
            }
            proposal.deliveryTime = deliveryTime;
        }

        await proposal.save();
        await proposal.populate([
            { path: "project", select: "title budget" },
            { path: "freelancer", select: "fullName image rating country major" },
        ]);

        res.json({
            message: "Proposal updated successfully",
            proposal,
        });
    } catch (error) {
        console.error("Error updating proposal:", error);
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
const chooseFreelancer = async (req, res) => {
    try {
        const { id } = req.params; // proposal id
        const clientId = req.userId;

        const client = await Client.findById(clientId);

        if (!client) {
            return res.status(404).json({
                message: "Client profile not found",
            });
        }

        const proposal = await Proposal.findById(id);

        if (!proposal) {
            return res.status(404).json({
                message: "Proposal not found",
            });
        }

        const project = await Project.findById(proposal.project);

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        // Make sure this project belongs to the authenticated client
        if (project.clientId.toString() !== clientId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to choose a freelancer for this project",
            });
        }

        // Make sure project doesn't already have a freelancer
        if (project.freelancerId) {
            return res.status(400).json({
                message: "A freelancer has already been selected for this project",
            });
        }

        // Proposal must still be pending
        if (proposal.status !== "pending") {
            return res.status(400).json({
                message: "This proposal is no longer available",
            });
        }

        // Assign freelancer to project
        project.freelancerId = proposal.freelancer;
        project.status = "in_progress";
        
        await project.save();

        // Accept selected proposal
        proposal.status = "accepted";
        await proposal.save();

        // Reject all other proposals
        await Proposal.updateMany(
            {
                project: project._id,
                _id: { $ne: proposal._id },
                status: "pending",
            },
            {
                $set: { status: "rejected" },
            }
        );

        // Return updated data
        await proposal.populate([
            {
                path: "freelancer",
                select: "fullName image Major location rating",
            },
            {
                path: "project",
                select: "title status",
            },
        ]);
        await project.populate([
            {
                path: "freelancerId",
                select: "fullName image Major location rating",
            },
        ]);
        return res.status(200).json({
            message: "Freelancer selected successfully",
            proposal,
            project,
        });

    } catch (error) {
        console.error("Error selecting freelancer:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};
module.exports = {addProposal , getProposals ,   detailsProposal , deleteProposal , updateProposal , myproposals , chooseFreelancer};