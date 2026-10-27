import express from "express";
import Room from "../models/room.js";

const router = express.Router();

// GET all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true });
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET one room by ID
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(400).json({ message: "Invalid room ID" });
  }
});

export default router;