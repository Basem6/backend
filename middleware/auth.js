// middleware/auth.js
const jwt = require('jsonwebtoken');

function verifyJwt(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

const verifyToken = (req, res, next) => {
    const cookieToken = req.cookies?.authToken;
    const authorization = req.get("Authorization");
    const bearerToken = authorization?.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length).trim()
        : null;
    const token = bearerToken || cookieToken;

    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }

    try {
        const decoded = verifyJwt(token);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

module.exports = verifyToken;
module.exports.verifySocketToken = (socket) => {
    const authToken = socket.handshake.auth?.token;
    const cookieHeader = socket.handshake.headers.cookie || "";
    const cookieToken = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("authToken="))
        ?.slice("authToken=".length);
    const token = authToken || cookieToken;

    if (!token) {
        throw new Error("Authentication required");
    }

    return verifyJwt(decodeURIComponent(token));
};