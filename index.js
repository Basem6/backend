const dns = require('dns');
<<<<<<< HEAD
const cors = require('cors');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth");
const clientRoutes = require("./routes/client");
const freelancerRoutes = require("./routes/freelancer");
const projectRoutes = require("./routes/project");
const verifyToken = require("./middleware/auth");
const { getMyContent } = require("./controls/myContent");
const {updateuser} = require("./controls/user")

dotenv.config();
connectDB();

const app = express();

// ============ MIDDLEWARE ============
app.use(express.json());
app.use(cookieParser());

=======
const cors =require('cors');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User= require("./models/User");
const bcrypt = require("bcrypt");
const axios =require("axios");


dotenv.config();

connectDB();

const app = express();
app.use(express.json());
>>>>>>> 852ca0189d3ed84152977a398779d53e742dcee7
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
<<<<<<< HEAD

// ============ HOME ============
app.get("/", (req, res) => {
    res.send("hello basem");
});

// ============ ROUTES ============
app.use("/api/auth", authRoutes);  // 🔑 كل الروتس تبدأ بـ /api/auth
app.use("/api/client", clientRoutes);
app.use(freelancerRoutes);
app.use(projectRoutes);
app.patch("/ubdate/personal",verifyToken, updateuser)
app.get("/api/my-content", verifyToken, getMyContent);

// ============ START SERVER ============
app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
=======
app.get("/",(req , res)=>{
    res.send("hello basem")
})


app.post("/register", async (req, res) => {
try {
    const { fullName, age, email, kind, password } = req.body;

    // التحقق من وجود البيانات المطلوبة
    if (!fullName || !age || !email || !kind || !password) {
    return res.status(400).json({ message: "من فضلك أدخل كل البيانات المطلوبة" });
    }

    // التحقق من عدم تكرار الإيميل
    const existingUser = await User.findOne({ email });
    if (existingUser) {
    return res.status(409).json({ message: "هذا البريد الإلكتروني مستخدم بالفعل" });
    }

    // تشفير الباسورد قبل الحفظ
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم بالباسورد المشفّر
    const newUser = new User({
    fullName,
    age,
    email,
    kind,
    password: hashedPassword,
    });

    await newUser.save();

    // الرد بدون إرجاع الباسورد أبدًا
    res.status(201).json({
    message: "تم إنشاء الحساب بنجاح",
    user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        kind: newUser.kind,
    },
    });

} catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في السيرفر" });
}
});


app.post("/login", async (req, res) => {
try {
    const { email, password } = req.body;

    // التحقق من وجود البيانات
    if (!email || !password) {
    return res.status(400).json({ message: "من فضلك أدخل البريد الإلكتروني وكلمة المرور" });
    }

    // البحث عن المستخدم بالإيميل مباشرة (بدل ما تجيب كل اليوزرز وتعمل loop)
    const user = await User.findOne({ email });

    if (!user) {
    return res.status(404).json({ message:"الايميل او كلمة السر خطا" });
    }

    // مقارنة الباسورد المدخل بالـ hash المخزن في الداتابيز
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
    return res.status(401).json({ message:"الايميل او كلمة السر خطا" });
    }

    // تسجيل الدخول ناجح
    res.status(200).json({
    message: "تم تسجيل الدخول بنجاح",
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
    },
    });

} catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في السيرفر" });
}
});

app.get("/callback", async (req, res) => {
const { code } = req.query;

console.log("Google Code:", code);
try {
    // تحويل code إلى access token
    const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:5000/callback",
        grant_type: "authorization_code",
    },
    {
        headers: {
        "Content-Type": "application/json",
        },
    }
    );

    const { access_token } = response.data;

    console.log("Access Token:", access_token);


    // جلب بيانات المستخدم
    const userResponse = await axios.get(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
        headers: {
        Authorization: `Bearer ${access_token}`,
        },
    }
    );

    console.log(userResponse.data);
    res.redirect("http://localhost:3000/callback");

} catch (error) {
    console.log(error.response?.data || error.message);
    res.status(500).send("Google Auth Error");
}
});

app.get("/alldata",async (req,res)=>{
    const users = await User.find()
    res.status(201).json(users)
})
app.listen(process.env.PORT,() => {
console.log(`Server running on http://localhost:${process.env.PORT}`);
>>>>>>> 852ca0189d3ed84152977a398779d53e742dcee7
});