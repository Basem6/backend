// middleware/auth.js
const jwt = require('jsonwebtoken');

function verifyJwt(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

const verifyToken = (req, res, next) => {
    const cookieToken = req.cookies?.authToken;
    const authorization = req.get("Authorization");

    console.log("🔑 VERIFY TOKEN:", {
        hasCookie: !!cookieToken,
        hasAuthorization: !!authorization,
        authorizationType: authorization?.split(" ")[0],
    });

    const bearerToken = authorization?.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length).trim()
        : null;

    const token = bearerToken || cookieToken;

    if (!token) {
        console.log("❌ NO TOKEN");
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("✅ JWT VALID:", decoded.userId);

        req.userId = decoded.userId;

        next();
    } catch (error) {
        console.log("❌ JWT ERROR:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
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