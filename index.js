const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const verifyToken = require('./middleware/auth');

dotenv.config();

const connectDB = require("./config/db");

const auth = require("./routes/auth");
const client = require("./routes/client");
const freelancer = require("./routes/freelancer");
const project = require("./routes/project");
const{ updateuser, updateProfileImage } = require("./controls/user")

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
cors({
origin: "http://localhost:3000",
credentials: true,
})
);

connectDB();

app.get("/", (req, res) => {
res.send("hello basem");
});

app.use("/api/auth", auth);
app.use("/client",client);
app.use("/ubdate/personal",verifyToken,updateuser)
app.use("api/auth/profile/image",verifyToken,updateProfileImage)
app.use(freelancer);
app.use(project);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});