const express = require("express");
const app = express();
const PORT = 5000;
const mongoose = require("mongoose");
const DB_URI = `mongodb://127.0.0.1:27017/authentication`;
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// connect to db
const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("DB connected successfully.");
  } catch (error) {
    console.log(`DB error: ${error}`);
  }
};
connectDB();

// user schema
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model("User", UserSchema);

// register
app.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existsUser = await User.findOne({ email });
    if (existsUser) {
      return res.status(401).json({
        message: "This User Already Exists.",
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashPassword,
    }).then((user) =>
      res.status(200).json({
        message: "User successfully created",
        user,
      })
    );
  } catch (error) {
    res.status(401).json({
      message: "User not created",
      error: error.message,
    });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // check if the use exists with email
    const existsUser = await User.findOne({ email });
    if (!existsUser) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    // compare password
    const validatePassword = await bcrypt.compare(
      password,
      existsUser.password
    );
    if (!validatePassword) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // generate a jwt token
    const token = jwt.sign({ id: existsUser.id }, "m.afs");

    res.status(200).json({
      message: "You're logged in",
      token: token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error.",
    });
  }
});

app.listen(PORT, () => console.log(`Server connected to port ${PORT}`));
