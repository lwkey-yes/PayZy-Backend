const express = require("express");
const { registerUser, loginUser, requestPasswordReset, resetPassword, getUserDetails, makePayment, updateUserProfile, getAllUsersForUser, getTransactionHistory,} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();


router.get("/profile", authenticateToken, getUserDetails); // View profile
router.put("/profile", authenticateToken, updateUserProfile); // Update profile

// router.put("/update-pin", authenticateToken, updateTransactionPin);

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);


// Request password reset
router.post("/request-password-reset", requestPasswordReset);

// Reset password
router.post("/reset-password", resetPassword);

// Payment Logic
router.post("/pay", authenticateToken, makePayment);

// Get all users for transactions (accessible by all authenticated users)
router.get("/transaction-list", authenticateToken, getAllUsersForUser);

// Transaction History
router.get("/transactions", authenticateToken, getTransactionHistory);

// // Admin-only route
// router.get("/users", authenticateToken, (req, res) => {
//     res.send("Admin users list.");
// });

module.exports = router;
