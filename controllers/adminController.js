const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await User.findOne({ email, role: "admin" });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.status(200).json({
            message: "Admin login successful",
            user: { id: admin._id, email: admin.email, role: admin.role },
            token,
        });
    } catch (error) {
        console.error("Error during admin login:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "user" }).select("-password");
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        res.status(200).json({ message: "Users fetched successfully", users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

const updateWalletBalance = async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
        return res.status(400).json({ message: "User ID and amount are required" });
    }

    if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than zero" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.walletBalance = (user.walletBalance || 0) + amount;
        await user.save();

        res.status(200).json({
            message: "Wallet balance updated successfully",
            user: { id: user._id, walletBalance: user.walletBalance },
        });
    } catch (error) {
        console.error("Error updating wallet balance:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

module.exports = { adminLogin, getAllUsers, updateWalletBalance };
