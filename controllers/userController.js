const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

require("dotenv").config();

// Request Password Reset
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 3600000;

    user.resetToken = resetToken;
    user.resetTokenExpiry = tokenExpiry;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
              <a href="${resetLink}">${resetLink}</a>`,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true,
  logger: true,
});

const getAllUsersForUser = async (req, res) => {
  try {
    const users = await User.find({}).select("name email walletBalance");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// View User Profile
const getUserDetails = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(req.user.id).select("-password -transactionPin");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserProfile = async (req, res) => {
  const { name, email } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const updatedData = {};
    if (name) updatedData.name = name;
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      updatedData.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updatedData, {
      new: true,
    }).select("-password -transactionPin");

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Register User
const registerUser = async (req, res) => {
  const { name, email, password, transactionPin } = req.body;

  try {
    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Validate Transaction PIN (must be exactly 4 digits)
    if (!/^\d{4}$/.test(transactionPin)) {
      return res.status(400).json({ message: "Transaction PIN must be exactly 4 digits" });
    }

    // ✅ Hash Password & Transaction PIN
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedTransactionPin = await bcrypt.hash(transactionPin, 10);

    // ✅ Create New User
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      transactionPin: hashedTransactionPin, // Save hashed PIN
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};


// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const { password: _, transactionPin, ...userWithoutSensitiveData } = user.toObject();

    res.status(200).json({ message: "Login successful", token, user: userWithoutSensitiveData });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


// Make Payment (With Transaction PIN)
const makePayment = async (req, res) => {
  const { receiverId, amount, transactionPin } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !amount || !transactionPin) {
    return res.status(400).json({ message: "Receiver ID, amount, and PIN are required" });
  }

  if (senderId === receiverId) {
    return res.status(400).json({ message: "You cannot send money to yourself." });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than zero." });
  }

  try {
    const sender = await User.findById(senderId).select("+transactionPin");
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Sender or Receiver not found." });
    }

    // Verify Transaction PIN
    const isPinValid = await bcrypt.compare(pin, sender.transactionPin || "");
    if (!isPinValid) {
      return res.status(401).json({ message: "Invalid transaction PIN" });
    }

    if (sender.walletBalance < amount) {
      await new Transaction({ sender: senderId, receiver: receiverId, amount, status: "failed" }).save();
      return res.status(400).json({ message: "Insufficient wallet balance." });
    }

    sender.walletBalance -= Number(amount);
    receiver.walletBalance += Number(amount);

    await sender.save();
    await receiver.save();

    await new Transaction({ sender: senderId, receiver: receiverId, amount, status: "success" }).save();

    res.status(200).json({
      message: "Payment successful",
      sender: { id: sender._id, walletBalance: sender.walletBalance },
      receiver: { id: receiver._id, walletBalance: receiver.walletBalance },
    });
  } catch (error) {
    console.error("Error making payment:", error);
    await new Transaction({ sender: senderId, receiver: receiverId, amount, status: "failed" }).save();
    res.status(500).json({ message: "Server error", error });
  }
};


// update transaction pin
// const updateTransactionPin = async (req, res) => {
//   const { currentPin, newPin } = req.body;
//   const user = await User.findById(req.user.id);

//   if (!user || !(await bcrypt.compare(currentPin, user.transactionPin))) {
//     return res.status(400).json({ message: "Incorrect current PIN" });
//   }

//   user.transactionPin = await bcrypt.hash(newPin, 10);
//   await user.save();

//   res.json({ message: "Transaction PIN updated successfully" });
// };

// Get Transaction History
const getTransactionHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name")
      .populate("receiver", "name")
      .sort({ date: -1 });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  getAllUsersForUser,
  getUserDetails,
  updateUserProfile,
  registerUser,
  loginUser,
  makePayment,
  getTransactionHistory,
  resetPassword,
  requestPasswordReset,
  updateTransactionPin,
};
