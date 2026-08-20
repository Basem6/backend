const mongoose = require("mongoose");
const Project = require("../models/Project");

function projectQuery() {
    return Project.find().populate("clientId", "fullName email image role").sort({ createdAt: -1 });
}

async function listProjects(req, res) {
    try {
        const projects = await projectQuery();
        res.status(200).json({ success: true, projects });
    } catch (error) {
        console.error("List projects error:", error);
        res.status(500).json({ success: false, message: "Failed to load projects" });
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid project id" });
        }
        const project = await Project.findById(req.params.id).populate("clientId", "fullName email image role");
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        res.status(200).json({ success: true, project });
    } catch (error) {
        console.error("Get project error:", error);
        res.status(500).json({ success: false, message: "Failed to load project" });
    }
}

async function createProject(req, res) {
    try {
        if (req.user?.role && req.user.role !== "client") {
            return res.status(403).json({ success: false, message: "Only clients can create projects" });
        }
        const { title, description, category = "", skills = [], budget = 0, deadline } = req.body;
        if (!title?.trim() || !description?.trim()) {
            return res.status(400).json({ success: false, message: "Title and description are required" });
        }
        const project = await Project.create({
            title: title.trim(), description: description.trim(), category, skills, budget, deadline, clientId: req.userId,
        });
        res.status(201).json({ success: true, project });
    } catch (error) {
        console.error("Create project error:", error);
        res.status(400).json({ success: false, message: error.message });
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