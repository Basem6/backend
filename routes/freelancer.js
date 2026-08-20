const express = require("express");
const verifyToken = require("../middleware/auth");
const { listFreelancers, listMyWorks, getFreelancer, updateFreelancer, addWork, deleteWork } = require("../controls/freelancer");

const router = express.Router();
router.get("/freelancers", listFreelancers);
router.get("/freelancer/my-works", verifyToken, listMyWorks);
router.get("/freelancers/:id",verifyToken, getFreelancer);
router.patch("/freelance/update/technical", verifyToken, updateFreelancer);
router.post("/freelancer/work", verifyToken, addWork);
router.delete("/freelancer/deletework/:id", verifyToken, deleteWork);

module.exports = router;