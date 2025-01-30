const express = require("express");
const { getWalletBalance, addMoneyToWallet } = require("../controllers/walletController");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();

// Get wallet balance
router.get("/get-wallet-balance", authenticateToken ,getWalletBalance);

// Add money to wallet
router.post("/add-money-to-wallet", addMoneyToWallet);

module.exports = router;
