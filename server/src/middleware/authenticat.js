const jwtProvider = require("../config/jwtProvider");
const userService = require("../services/user.service");

const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log("No token provided or invalid format");
            return res.status(401).json({
                message: "Access Denied - No token provided",
                status: false
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            console.log("Token is empty");
            return res.status(401).json({
                message: "Access Denied - Empty token",
                status: false
            });
        }
        console.log("Token received:", token);

        // Verify and decode token
        const userId = jwtProvider.getUserIdFromToken(token);
        if (!userId) {
            console.log("Invalid token - no userId");
            return res.status(401).json({
                message: "Access Denied - Invalid token",
                status: false
            });
        }
        console.log("Extracted userId:", userId);
        
        // Find user
        const user = await userService.findUserById(userId);
        console.log("Found user:", user);

        if (!user || !user._id) {
            console.log("User not found or invalid");
            return res.status(401).json({
                message: "Access Denied - User not found",
                status: false
            });
        }

        // Attach user to request
        req.user = user;
        
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            message: "Authentication failed - Server error",
            error: error.message,
            status: false
        });
    }
}

module.exports = authenticate;