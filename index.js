const dns = require('dns');
const cors = require('cors');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth");
const clientRoutes = require("./routes/client");
const freelancerRoutes = require("./routes/freelancer");
const projectRoutes = require("./routes/project");
const verifyToken = require("./middleware/auth");
const { getMyContent } = require("./controls/myContent");
const {updateuser} = require("./controls/user")

dotenv.config();
connectDB();

const app = express();

// ============ MIDDLEWARE ============
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// ============ HOME ============
app.get("/", (req, res) => {
    res.send("hello basem");
});

// ============ ROUTES ============
app.use("/api/auth", authRoutes);  // 🔑 كل الروتس تبدأ بـ /api/auth
app.use("/api/client", clientRoutes);
app.use(freelancerRoutes);
app.use(projectRoutes);
app.patch("/ubdate/personal",verifyToken, updateuser)
app.get("/api/my-content", verifyToken, getMyContent);

// ============ START SERVER ============
app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});