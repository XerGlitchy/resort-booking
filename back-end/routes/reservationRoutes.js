import express from "express";
import Reservation from "../models/reservation.js";

const router = express.Router();

// GET all reservations
router.get("/", async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("roomId", "name type pricePerNight")
      .sort({ createdAt: -1 });

    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET one reservation by ID
router.get("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("roomId", "name type pricePerNight");

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found"
      });
    }

    res.status(200).json(reservation);
  } catch (error) {
    res.status(400).json({
      message: "Invalid reservation ID"
    });
  }
});

export default router;