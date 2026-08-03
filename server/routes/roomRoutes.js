// server/routes/roomRoutes.js
const express = require("express");
const router = express.Router();
const { getMyRooms, createRoom, shareRoom, deleteRoom } = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // All room endpoints require authentication

router.get("/my-rooms", getMyRooms);
router.post("/create", createRoom);
router.post("/:roomId/share", shareRoom);
router.delete("/:roomId", deleteRoom);

module.exports = router;
