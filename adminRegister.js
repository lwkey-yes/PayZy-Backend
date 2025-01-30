const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
require("dotenv").config();

mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(async () => {
        console.log("Connected to MongoDB");

        const hashedPassword = await bcrypt.hash("cglwkey", 10);

        const adminUser = new User({
            name: "Ghost",
            email: "cglwkey@gmail.com",
            password: hashedPassword,
            role: "admin",
        });

        await adminUser.save();
        console.log("Admin user created:", adminUser);
        mongoose.disconnect();
    })
    .catch((err) => {
        console.error("Error connecting to mongoDB:", err);
    });