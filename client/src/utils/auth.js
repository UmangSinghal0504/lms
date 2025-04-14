import { clerkClient } from "@clerk/express";

export const protectEducator = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Verify user exists in your database
    const userExists = await User.exists({ _id: req.auth.userId });
    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found in database" 
      });
    }

    const response = await clerkClient.users.getUser(req.auth.userId);
    
    if (response.publicMetadata.role !== "educator") {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized Access" 
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// New middleware to verify user exists in database
export const verifyUserExists = async (req, res, next) => {
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