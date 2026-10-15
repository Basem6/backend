const express = require("express");
const { searchFreelancers, searchJobs } = require("../controls/search");

const router = express.Router();

router.get("/freelancers", searchFreelancers);
router.get("/jobs", searchJobs);

module.exports = router;
