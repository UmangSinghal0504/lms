import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

// Middleware: Protect Educator Routes
const protectEducator = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const userId = req.auth.userId;
    const response = await clerkClient.users.getUser(userId);

    // Check for educator role in public metadata
    if (response.publicMetadata.role !== "educator") {
      return res.status(403).json({ success: false, message: "Unauthorized Access" });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Middleware: Verify User Exists in Database
const verifyUserExists = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      return next(); // Skip if no auth required
    }

    const userExists = await User.exists({ _id: req.auth.userId });
    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found in database" 
      });
    }

    next();
  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export { protectEducator, verifyUserExists };