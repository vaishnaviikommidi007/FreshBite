const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ✅ SIGNUP
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Input validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required ❌" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters ❌" });
        }

        // 2. Check if email already exists
        const [existing] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: "Email already registered ❌" });
        }

        // 3. Hash password and insert user
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: "User registered successfully ✅" });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Signup failed" });
    }
});


// ✅ LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Input validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required ❌" });
        }

        // 2. Find user
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        if (rows.length === 0) {
            return res.status(400).json({ message: "User not found ❌" });
        }

        // 3. Compare password
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials ❌" });
        }

        const token = jwt.sign(
                { id: user.id, email: user.email },
                    "freshbite_secret_key",   // use an env variable in production
                { expiresIn: "7d" }
            );

            res.json({
                    message: "Login successful ✅",
                    token,//              ✅ Now frontend gets the token
                    name: user.name,
                    user: { id: user.id, name: user.name, email: user.email }
                });                     
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;