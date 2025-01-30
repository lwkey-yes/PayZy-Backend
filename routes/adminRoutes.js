const express = require("express");
const { updateWalletBalance, adminLogin, getAllUsers } = require("../controllers/adminController");
const { verifyAdmin, authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();


router.post("/login", adminLogin);
router.get("/users", authenticateToken, verifyAdmin, getAllUsers);
router.put("/users/update-wallet", authenticateToken, verifyAdmin, updateWalletBalance);

module.exports = router;