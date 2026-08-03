// server/controllers/roomController.js
const mongoose = require("mongoose");
const Room = require("../models/Room");
const localStore = require("../utils/localStore");

// @desc    Get all rooms owned by or shared with the authenticated user
// @route   GET /api/rooms/my-rooms
exports.getMyRooms = async (req, res) => {
  try {
    const { username, email } = req.user;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const rooms = await Room.find({
        $or: [
          { owner: { $regex: new RegExp(`^${username}$`, "i") } },
          { ownerEmail: email ? email.toLowerCase() : "" },
          { collaborators: { $in: [username.toLowerCase(), (email || "").toLowerCase()] } },
        ],
      }).sort({ createdAt: -1 });

      return res.status(200).json({ rooms });
    } else {
      const rooms = localStore.findRoomsByUser(username, email);
      return res.status(200).json({ rooms });
    }
  } catch (err) {
    console.error("getMyRooms Error:", err);
    res.status(500).json({ message: "Failed to fetch saved workspaces." });
  }
};

// @desc    Create a new saved room for the authenticated user
// @route   POST /api/rooms/create
exports.createRoom = async (req, res) => {
  try {
    const { roomId, name, description } = req.body;
    const { username, email } = req.user;

    if (!roomId || !name) {
      return res.status(400).json({ message: "Room ID and Room Name are required." });
    }

    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // Check if room ID already exists
      const existing = await Room.findOne({ roomId });
      if (existing) {
        return res.status(400).json({ message: "A workspace with this Room ID already exists." });
      }

      const room = await Room.create({
        roomId: roomId.trim(),
        name: name.trim(),
        owner: username,
        ownerEmail: email || "",
        description: description || "",
        collaborators: [],
      });

      return res.status(201).json({ room });
    } else {
      const existing = localStore.findRoomById(roomId.trim());
      if (existing) {
        return res.status(400).json({ message: "A workspace with this Room ID already exists." });
      }

      const room = localStore.createRoom({
        roomId: roomId.trim(),
        name: name.trim(),
        owner: username,
        ownerEmail: email || "",
        description: description || "",
      });

      return res.status(201).json({ room });
    }
  } catch (err) {
    console.error("createRoom Error:", err);
    res.status(500).json({ message: "Failed to create workspace." });
  }
};

// @desc    Share a room with a collaborator username or email
// @route   POST /api/rooms/:roomId/share
exports.shareRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { collaborator } = req.body;

    if (!collaborator) {
      return res.status(400).json({ message: "Collaborator username or email is required." });
    }

    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ message: "Workspace not found." });
      }

      const lowerCollab = collaborator.trim().toLowerCase();
      if (!room.collaborators.includes(lowerCollab)) {
        room.collaborators.push(lowerCollab);
        await room.save();
      }

      return res.status(200).json({ room, message: `Access granted to ${collaborator}.` });
    } else {
      const room = localStore.addCollaborator(roomId, collaborator);
      if (!room) {
        return res.status(404).json({ message: "Workspace not found." });
      }
      return res.status(200).json({ room, message: `Access granted to ${collaborator}.` });
    }
  } catch (err) {
    console.error("shareRoom Error:", err);
    res.status(500).json({ message: "Failed to share workspace." });
  }
};

// @desc    Delete a room owned by the user
// @route   DELETE /api/rooms/:roomId
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { username } = req.user;

    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ message: "Workspace not found." });
      }
      if (room.owner.toLowerCase() !== username.toLowerCase()) {
        return res.status(403).json({ message: "Only the owner can delete this workspace." });
      }

      await Room.deleteOne({ _id: room._id });
      return res.status(200).json({ message: "Workspace deleted successfully." });
    } else {
      const deleted = localStore.deleteRoom(roomId, username);
      if (!deleted) {
        return res.status(403).json({ message: "Could not delete workspace (check ownership)." });
      }
      return res.status(200).json({ message: "Workspace deleted successfully." });
    }
  } catch (err) {
    console.error("deleteRoom Error:", err);
    res.status(500).json({ message: "Failed to delete workspace." });
  }
};
