// routes/auth.js
const express = require('express');
const validator = require('email-validator');
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const { updateProfileImage } = require('../controls/user');

const router = express.Router();

router.patch("/profile/image", verifyToken, updateProfileImage);

// ============ REGISTER ============
router.post("/register", async (req, res) => {
    try {
        const { fullName, age, email, password , role } = req.body;

        // 1️⃣ Validate required fields
        if (!fullName || !age || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
                missing: {
                    fullName: !fullName,
                    age: !age,
                    email: !email,
                    password: !password
                }
            });
        }

        // 2️⃣ Validate data format
        if (fullName.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: "Full name must be at least 3 characters"
            });
        }

        if (!validator.validate(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
            return res.status(400).json({
                success: false,
                message: "Age must be between 13 and 120"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        // 3️⃣ Check email
        console.log(`🔍 Checking email: ${email}`);
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        if (existingUser) {
            console.log(`❌ Email already exists: ${email}`);
            return res.status(409).json({
                success: false,
                message: "This email is already registered"
            });
        }

        console.log(`✅ Email is available: ${email}`);

        // 4️⃣ Hash password
        console.log("🔐 Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 12);

        // 5️⃣ Create new user
        const newUser = new User({
            fullName: fullName.trim(),
            age: ageNum,
            email: email.toLowerCase(),
            role,
            password: hashedPassword,
            createdAt: new Date(),
        });

        const savedUser = await newUser.save();
        console.log(`✅ User saved: ${savedUser._id}`);

        // 6️⃣ Create JWT token
        const token = jwt.sign(
            {
                userId: savedUser._id,
                email: savedUser.email,
                role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        // 7️⃣ Send response
        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user:savedUser
        });

    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered"
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error. Please try again later"
        });
    }
});

// ============ LOGIN ============
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                message: "من فضلك أدخل البريد الإلكتروني وكلمة المرور" 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                message: "الايميل او كلمة السر خطا" 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ 
                message: "الايميل او كلمة السر خطا" 
            });
        }

        // أنشئ JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email , role:user.role},
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            message: "تم تسجيل الدخول بنجاح",
            user: user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "حدث خطأ في السيرفر" });
    }
});

// ============ GOOGLE LOGIN ============
router.post("/google", async (req, res) => {
    const { code, redirectUri } = req.body;

    try {
        const response = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }
        );

        const { access_token } = response.data;

        const userResponse = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: { Authorization: `Bearer ${access_token}` },
            }
        );

        const googleUser = userResponse.data;

        if (!googleUser.email || !googleUser.name) {
            return res.status(400).json({
                success: false,
                message: "بيانات جوجل غير كاملة"
            });
        }

        const user = await User.findOne({ email: googleUser.email });

        if (!user) {
            return res.status(200).json({
                success: true,
                isNewUser: true,
                message: "Choose an account type to complete registration",
                googleData: {
                    fullName: googleUser.name,
                    email: googleUser.email,
                    image: googleUser.picture || "",
                    googleId: googleUser.id,
                },
            });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email , role:user.role},
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error("Google auth error:", error);
        res.status(401).json({
            success: false,
            message: "فشل الدخول مع جوجل"
        });
    }
});

// ============ COMPLETE GOOGLE REGISTRATION ============
router.post("/google/complete", async (req, res) => {
    try {
        const { fullName, email, image = "", googleId, role } = req.body;

        if (!fullName?.trim() || !email?.trim() || !googleId || !role) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, Google ID, and role are required",
            });
        }

        if (!["client", "freelancer"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be client or freelancer",
            });
        }

        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase().trim() }, { googleId }],
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This Google account is already registered",
            });
        }

        const user = await User.create({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            image,
            googleId,
            role,
        });

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                image: user.image,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Google registration completion error:", error);
        return res.status(error.code === 11000 ? 409 : 500).json({
            success: false,
            message: error.code === 11000 ? "This Google account is already registered" : "Failed to complete Google registration",
        });
    }
});

// ============ GET ALL DATA ============
router.get("/alldata", async (req, res) => {
    const users = await User.find();
    res.status(200).json(users);
});

// ============ GET USER ============
router.get("/me", verifyToken );

// ============ LOGOUT ============
router.post("/logout", (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true, message: "تم تسجيل الخروج" });
});

module.exports = router;