const { default: mongoose } = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require('../models/User');

const { trace } = require("../routes/walletRoutes");
const { json } = require("body-parser");

const getTransactionsByUserId = async (req, res) => {
    try {
        const { userId } = req.body;
        const { page = 1, limit = 10 } = req.query;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('userId');
        
        const totalTransactions = await Transaction.countDocuments({ userId });
        const totalPages = Math.ceil(totalTransactions / limit );

        res.status(200).json({
            transactions,
            totalPages,
            currentPage: page,
            totalTransactions
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const { page = 1, limti = 10 } = req.query;

        const transactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limti))
            .populate('userId');

        const totalTransactions = await Transaction.countDocuments();

        const totalPages = Math.ceil(totalTransactions / limit);

        res.status(200).json({
            transactions,
            totalPages,
            currentPage: page,
            totalTransactions
        });
    } catch (error) {
        console.error("Error fetching all transactions:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getTransactionById = async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({ message: "Transaction ID is required" });
        }

        const transaction = await Transaction.findById(transactionId)
            .populate('userId');
        
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.status(200).json({ transaction });
    } catch (error) {
        console.error("Error fetching transaction:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getTransactionsByUserId, getAllTransactions, getTransactionById };