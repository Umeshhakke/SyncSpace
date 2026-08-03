// server/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/syncspace";
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Do not hang if MongoDB is offline
    });
    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (err) {
    console.warn("⚠️ MongoDB not connected - switching to persistent JSON fallback store in server/data/.");
    return false;
  }
};

module.exports = connectDB;