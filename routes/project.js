const express = require("express");
const verifyToken = require("../middleware/auth");
const { listProjects, listMyProjects, getProject, createProject, updateProject, deleteProject } = require("../controls/project");
const { addProposal , getProposals , deleteProposal} = require("../controls/proposal");

const router = express.Router();

router.get("/projects", listProjects);
router.get("/my-projects", verifyToken, listMyProjects);
router.get("/projects/:id", getProject);
router.get("/projects/:id/allproposal", getProposals);
router.post("/projects/:id/addproposal", verifyToken, addProposal);
router.delete("/projects/:id/deleteproposal", verifyToken, deleteProposal);
// router.get("/project/:id", getProject);

router.post("/api/client/addproject", verifyToken, createProject);
router.patch("/projects/:id", verifyToken, updateProject);
router.delete("/projects/:id", verifyToken, deleteProject);

module.exports = router;