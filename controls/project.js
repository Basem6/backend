const mongoose = require("mongoose");
const Project = require("../models/Project");
const Client = require("../models/Client");
function projectQuery(clientId) {
    return Project.find(clientId ? { clientId } : {})
        .populate({
            path: "clientId",
            match: { _id: { $exists: true } },
            select: "fullName email image role",
        })
        .populate({
            path: "freelancerId",
            select: "fullName  image major",
        })
        .populate({
            path: "proposals",
            populate: {
                path: "freelancer",
                select: "fullName image Major location rating portfolio",
            },
        })
        .sort({ createdAt: -1 });
}

async function listProjects(req, res) {
    try {
        const projects = await projectQuery(req.userId);

        const validProjects = projects.filter(
            (project) => project.clientId !== null
        );

        res.status(200).json({
            success: true,
            projects: validProjects,
        });
    } catch (error) {
        console.error("List projects error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load projects",
        });
    }
}

async function listMyProjects(req, res) {
    try {
        const projects = await Project.find({ clientId: req.userId })
            .populate("clientId", "fullName email image role")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, projects });
    } catch (error) {
        console.error("List my projects error:", error);
        res.status(500).json({ success: false, message: "Failed to load your projects" });
    }
}

async function getProject(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project id",
      });
    }

    const project = await Project.findById(id)
      .populate(
        "clientId",
        "fullName email image role createdAt"
      )
      .populate(
        "freelancerId",
        "fullName  image major"
      )
      .populate({
        path: "proposals",
        populate: {
          path: "freelancer",
          select:
            "fullName image Major location rating portfolio",
        },
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });

  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load project",
    });
  }
}

async function createProject(req, res) {
    try {
        // Authorization
        if (!req.role== "client") {
            return res.status(403).json({ 
                success: false, 
                message: "Only clients can create projects" 
            });
        }

        const { title, description, category = "", skills = [], budget = 0, deadline } = req.body;

        // Validate title & description
        if (!title?.trim() || !description?.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Title and description are required" 
            });
        }

        // Validate budget
        if (Number(budget) < 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Budget must be a non-negative number" 
            });
        }
        // Create project
        const project = await Project.create({
            title: title.trim(),
            description: description.trim(),
            category,
            skills: Array.isArray(skills) ? skills.filter(s => s) : [],
            budget,
            deadline: deadline || null,
            clientId: req.userId,
            status: "open"
        });

        // Update client
        const updatedClient = await Client.findByIdAndUpdate(
            req.userId,
            { $push: { postedProjects: project._id } },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedClient) {
            await Project.findByIdAndDelete(project._id);
            return res.status(404).json({ 
                success: false, 
                message: "Client not found" 
            });
        }

        res.status(201).json({ 
            success: true, 
            project,
            message: "Project created successfully"
        });

    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to create project" 
        });
    }
}

async function updateProject(req, res) {
    try {
        const allowed = ["title", "description", "category", "skills", "budget", "deadline", "status"];
        const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, clientId: req.userId },
            updates,
            { new: true, runValidators: true }
        ).populate("clientId", "fullName email image role");
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        res.status(200).json({ success: true, project });
    } catch (error) {
        console.error("Update project error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
}

async function deleteProject(req, res) {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, clientId: req.userId });
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        res.status(200).json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
        console.error("Delete project error:", error);
        res.status(500).json({ success: false, message: "Failed to delete project" });
    }
}

module.exports = { listProjects, listMyProjects, getProject, createProject, updateProject, deleteProject };