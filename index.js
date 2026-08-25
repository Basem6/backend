const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const verifyToken = require("./middleware/auth");
const { verifySocketToken } = require("./middleware/auth");
const connectDB = require("./config/db");
const User = require("./models/User");
const chat = require("./routes/chat");
const {
    getConversationForUser,
    createMessage,
} = require("./controls/chat");

const auth = require("./routes/auth");
const client = require("./routes/client");
const freelancer = require("./routes/freelancer");
const project = require("./routes/project");

const {
updateuser,
updateProfileImage,
} = require("./controls/user");

dotenv.config();

const app = express();

/* =========================
Middleware
========================= */

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
"http://localhost:3000",
process.env.FRONTEND_URL,
].filter(Boolean);

const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin);

app.use(
cors({
    origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
        callback(null, true);
    } else {
        callback(new Error("Not allowed by CORS"));
    }
    },
    credentials: true,
})
);

/* =========================
Database
========================= */

connectDB();

/* =========================
Routes
========================= */

app.get("/", (req, res) => {
res.send("hello basem");
});

app.use("/api/auth", auth);
app.use("/client", client);
app.use("/api/chat", chat);

app.patch(
"/ubdate/personal",
verifyToken,
updateuser
);

app.patch(
"/api/auth/profile/image",
verifyToken,
updateProfileImage
);

app.use(freelancer);
app.use(project);

/* =========================
HTTP Server
========================= */

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

/* =========================
Socket.IO
========================= */
const io = new Server(server, {
cors: {
    origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
        callback(null, true);
    } else {
        callback(new Error("Not allowed by CORS"));
    }
    },
    credentials: true,
},
});

const activeUsers = new Map(); // userId -> { socketId, conversationIds }
const typingUsers = new Map(); // userId -> { conversationId, timeout }
io.use((socket, next) => {
    try {
        const decoded = verifySocketToken(socket);
        socket.userId = String(decoded.userId);
        next();
    } catch (error) {
        next(new Error("Authentication required"));
    }
});

io.on("connection", async (socket) => {
    console.log("🟢 User connected:", socket.userId);
    
    await User.findByIdAndUpdate(socket.userId, {
        online: true,
        lastSeen: new Date().toISOString(),
    });
    
    const fail = (error) => {
        socket.emit("chat-error", { message: error.message || "Chat request failed" });
    };

    socket.on("joinConversation", async (conversationId, acknowledge) => {
        try {
            console.log("join done")
            const conversation = await getConversationForUser(conversationId, socket.userId);
            if (!conversation) throw new Error("Conversation not found");
            socket.join(String(conversation._id));
            acknowledge?.({ success: true, conversationId: String(conversation._id) });
        } catch (error) {
            acknowledge?.({ success: false, message: error.message });
            fail(error);
        }
    });

    socket.on("send-message", async (payload, acknowledge) => {
    console.log("send done")
    try {
        const message = await createMessage(
            payload?.conversationId,
            socket.userId,
            payload?.body
        );

        const conversationId = String(message.conversation);

        const messageData = {
            ...message.toObject(),
            conversationId,
        };
        io.to(conversationId).emit("message:new", messageData);

        acknowledge?.({
            success: true,
            message: messageData,
        });

    } catch (error) {
        acknowledge?.({
            success: false,
            message: error.message,
        });

        fail(error);
    }
});

    const emitTyping = async (event, payload) => {
        console.log("typing")
        try {
            const conversation = await getConversationForUser(payload?.conversationId, socket.userId);
            if (!conversation) throw new Error("Conversation not found");
            socket.to(String(conversation._id)).emit(event, { userId: socket.userId });
        } catch (error) {
            fail(error);
        }
    };

    socket.on("typing", (payload) => emitTyping("user-typing", payload));
    socket.on("stop-typing", (payload) => emitTyping("user-stop-typing", payload));

    socket.on("disconnect", async () => {
        await User.findByIdAndUpdate(socket.userId, {
            online: false,
            lastSeen: new Date().toISOString(),
        });
        console.log("🔴 User disconnected:", socket.userId);
    });
});

/* =========================
Start Server
========================= */

server.listen(PORT, "0.0.0.0", () => {
console.log(`🚀 Server running on ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`);
});