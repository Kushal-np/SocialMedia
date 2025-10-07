import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectedRoute = async (req, res, next) => {
  try {
    // ✅ Get token from cookies or Authorization header
    const token = req.cookies?.jwt || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized, token not provided" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Match the key used when signing the token
    const userId = decoded.userId || decoded.id;

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    req.user = user; // attach user to request
    next();
  } catch (error) {
    console.log("Error in protectedRoute middleware:", error.message);

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: error.message });
    }

    return res.status(500).json({ success: false, error: error.message });
  }
};
