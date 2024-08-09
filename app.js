const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require('dotenv').config();

app.use(express.json());
app.use(cors());

const mongoUrl = process.env.MONGO_URL || "mongodb+srv://naikkajal0603:admin@cluster0.umsjdwh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoUrl).then(() => {
    console.log("Database connected");
}).catch((e) => {
    console.log(e);
});

require("./userdetails");
const User = mongoose.model("UserInfo");

// Add a schema for food entries
const FoodEntrySchema = new mongoose.Schema({
    userId: String,
    mealType: String,
    foodItem: String,
    calories: Number
}, {
    collection: "FoodEntries"
});
const FoodEntry = mongoose.model("FoodEntries", FoodEntrySchema);

app.get("/", (req, res) => {
    res.send({ status: "Started" });
});

app.post('/register', async (req, res) => {
    const { name, email, mobile, password } = req.body;
    const oldUser = await User.findOne({ email: email });
    if (oldUser) {
        return res.send({ data: "User already exists" });
    }
    const encryptedPassword = await bcrypt.hash(password, 8);
    try {
        await User.create({
            name: name,
            email: email,
            mobile,
            password: encryptedPassword,
        });
        res.send({ status: "ok", data: "User Created" });
    } catch (error) {
        res.send({ status: "error", data: error });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
        return res.send({ status: "error", data: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.send({ status: "error", data: "Invalid Password" });
    }

    const token = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET_KEY, 
        { expiresIn: "1h" }
    );

    res.send({ status: "ok", data: "Login successful", token: token });
});


app.post('/calculate', (req, res) => {
    const { height, weight, age, gender, activityLevel } = req.body;
    let BMR;
    if (gender === 'male') {
        BMR = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else if (gender === 'female') {
        BMR = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    } else {
        return res.status(400).send({ error: 'Invalid gender' });
    }

    let dailyCalorieIntake;
    if (activityLevel === 'sedentary') {
        dailyCalorieIntake = BMR * 1.2;
    } else if (activityLevel === 'active') {
        dailyCalorieIntake = BMR * 1.55;
    } else {
        return res.status(400).send({ error: 'Invalid activity level' });
    }

    res.send({ dailyCalorieIntake: Math.round(dailyCalorieIntake) });
});

app.listen(5011, () => {
    console.log("Server started on port 5011");
});
