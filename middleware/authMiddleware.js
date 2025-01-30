const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (error) {
      return res.status(403).json({ message: "Invalid token" });
    }
  };
  

const verifyAdmin = (req, res, next) => {
    if (req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ message: "Access restricted to admins." });
};


module.exports = { authenticateToken, verifyAdmin };
