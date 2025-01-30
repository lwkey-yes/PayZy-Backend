const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Get Wallet Balance
const getWalletBalance = async (req, res) => {
    try {
        const { id: userId } = req.user; // Fetching userId from authenticated user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ walletBalance: user.walletBalance });
    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        res.status(500).json({ message: "Unable to fetch wallet balance" });
    }
};

// Add Money to Wallet
const addMoneyToWallet = async (req, res) => {
    try {
        const { id: userId } = req.user; // Fetching userId from authenticated user
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount provided" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update wallet balance
        user.walletBalance += parseFloat(amount);
        await user.save();

        // Log transaction
        const transaction = new Transaction({
            userId,
            amount,
            transactionType: "credit",
            status: "success",
            timestamp: new Date(),
        });

        await transaction.save();

        res.status(200).json({
            message: "Money added successfully",
            walletBalance: user.walletBalance,
        });
    } catch (error) {
        console.error("Error adding money to wallet:", error);
        res.status(500).json({ message: "Unable to add money to wallet" });
    }
};

module.exports = { getWalletBalance, addMoneyToWallet };
