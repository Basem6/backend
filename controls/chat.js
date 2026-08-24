const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

function validId(id) {
    return mongoose.isValidObjectId(id);
}

async function getConversationForUser(conversationId, userId) {
    if (!validId(conversationId)) return null;
    return Conversation.findOne({
        _id: conversationId,
        participants: userId,
    });
}

async function createMessage(conversationId, senderId, body) {
    const text = typeof body === "string" ? body.trim() : "";
    if (!text || text.length > 5000) {
        const error = new Error("Message must be between 1 and 5000 characters");
        error.status = 400;
        throw error;
    }

    const conversation = await getConversationForUser(conversationId, senderId);
    if (!conversation) {
        const error = new Error("Conversation not found");
        error.status = 404;
        throw error;
    }

    const message = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        body: text,
        readBy: [senderId],
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: text,
        lastMessageAt: message.createdAt,
    });

    return Message.findById(message._id).populate("sender", "fullName image role");
}

async function listConversations(req, res) {
    const conversations = await Conversation.find({ participants: req.userId })
        .populate("participants", "fullName image role online lastSeen")
        .sort({ lastMessageAt: -1, updatedAt: -1 });
    res.json({ success: true, conversations });
}

async function createConversation(req, res) {
    const { participantId } = req.body;
    if (!validId(participantId) || participantId === String(req.userId)) {
        return res.status(400).json({ success: false, message: "A different valid participant is required" });
    }
    if (!await User.exists({ _id: participantId })) {
        return res.status(404).json({ success: false, message: "Participant not found" });
    }

    let conversation = await Conversation.findOne({
        participants: { $all: [req.userId, participantId] },
        $expr: { $eq: [{ $size: "$participants" }, 2] },
    });
    if (!conversation) {
        conversation = await Conversation.create({ participants: [req.userId, participantId] });
    }
    await conversation.populate("participants", "fullName image role online lastSeen");
    return res.status(200).json({ success: true, conversation });
}

async function listMessages(req, res) {
    const conversation = await getConversationForUser(req.params.conversationId, req.userId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const query = { conversation: conversation._id };
    if (req.query.before && !Number.isNaN(Date.parse(req.query.before))) {
        query.createdAt = { $lt: new Date(req.query.before) };
    }
    const messages = await Message.find(query)
        .populate("sender", "fullName image role")
        .sort({ createdAt: -1 })
        .limit(limit);
    res.json({ success: true, messages: messages.reverse() });
}

async function sendMessage(req, res) {
    try {
        const message = await createMessage(req.params.conversationId, req.userId, req.body.text);
        res.status(201).json({ success: true, message });

    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}

async function markRead(req, res) {
    const conversation = await getConversationForUser(req.params.conversationId, req.userId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    await Message.updateMany(
        { conversation: conversation._id, readBy: { $ne: req.userId } },
        { $addToSet: { readBy: req.userId } }
    );
    res.json({ success: true });
}

module.exports = {
    getConversationForUser,
    createMessage,
    listConversations,
    createConversation,
    listMessages,
    sendMessage,
    markRead,
};