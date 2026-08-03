// server/models/Room.js
const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: String, // Username of the room creator
    required: true,
    index: true,
  },
  ownerEmail: {
    type: String,
    lowercase: true,
  },
  collaborators: [
    {
      type: String, // Array of usernames or emails granted access
      lowercase: true,
      trim: true,
    },
  ],
  description: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Room", RoomSchema);
