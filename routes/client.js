const express = require("express");
const verifyToken = require("../middleware/auth");
const { getClient, updateClient } = require("../controls/client");

const router = express.Router();
router.get("/:id", verifyToken, getClient);
module.exports = router;