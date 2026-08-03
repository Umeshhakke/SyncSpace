// server/controllers/authController.js
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const localStore = require("../utils/localStore");

const JWT_SECRET = process.env.JWT_SECRET || "codeboard_super_secret_key_2026";

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide username, email, and password." });
    }

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // Use Mongoose
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: { $regex: new RegExp(`^${username}$`, "i") } },
        ],
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username or email is already taken." });
      }

      const user = await User.create({
        username,
        email: email.toLowerCase(),
        password,
      });

      const token = generateToken(user);
      return res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } else {
      // Use Local JSON Store fallback
      const existingUser = localStore.findUserByEmailOrUsername(username) ||
                           localStore.findUserByEmailOrUsername(email);
      if (existingUser) {
        return res.status(400).json({ message: "Username or email is already taken." });
      }

      const newUser = await localStore.createUser({ username, email, password });
      const token = generateToken(newUser);
      return res.status(201).json({
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    }
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please enter username/email and password." });
    }

    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { username: { $regex: new RegExp(`^${identifier}$`, "i") } },
        ],
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid username/email or password." });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid username/email or password." });
      }

      const token = generateToken(user);
      return res.status(200).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } else {
      // Use Local JSON Store
      const user = localStore.findUserByEmailOrUsername(identifier);
      if (!user) {
        return res.status(401).json({ message: "Invalid username/email or password." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid username/email or password." });
      }

      const token = generateToken(user);
      return res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user profile." });
  }
};
