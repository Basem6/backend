const express = require("express");
const verifyToken = require("../middleware/auth");
const {
    listConversations,
    createConversation,
    listMessages,
    sendMessage,
    markRead,
} = require("../controls/chat");

const router = express.Router();
router.use(verifyToken);

router.get("/conversations",verifyToken, listConversations);
router.post("/conversations",verifyToken, createConversation);
router.get("/conversations/:conversationId/messages",verifyToken, listMessages);
router.post("/conversations/:conversationId",verifyToken ,  sendMessage);
router.patch("/conversations/:conversationId/read", markRead);

module.exports = router;