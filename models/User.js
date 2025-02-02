const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    walletBalance: {type: Number, default:10000},
    role: { type: String, default: "user"},
    transactionPin: { type: String, select: false },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
});

module.exports = mongoose.model("User", UserSchema);
