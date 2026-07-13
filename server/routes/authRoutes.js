const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.route("/profile").get(protect, getProfile).put(protect, updateProfile);

module.exports = router;
