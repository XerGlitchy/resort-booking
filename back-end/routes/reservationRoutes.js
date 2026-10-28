import express from "express";
import mongoose from "mongoose";
import Reservation from "../models/reservation.js";
import Room from "../models/room.js";
import User from "../models/user.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.auth.userId })
      .populate("roomId", "name type pricePerNight")
      .sort({ createdAt: -1 });

    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Could not load your reservations." });
  }
});

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("roomId", "name type pricePerNight");

    res.status(200).json(reservations.sort((left, right) => right.createdAt - left.createdAt));
  } catch (error) {
    res.status(500).json({ message: "Could not load reservations." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { roomId, checkIn: checkInValue, checkOut: checkOutValue, replaceReservationId } = req.body || {};
  const checkIn = new Date(checkInValue);
  const checkOut = new Date(checkOutValue);
  const guestCount = Number(req.body?.guestCount);

  if (!mongoose.isValidObjectId(roomId)) {
    return res.status(400).json({ message: "Choose a valid room." });
  }
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return res.status(400).json({ message: "Check-out must be after check-in." });
  }

  try {
    const [room, user] = await Promise.all([
      Room.findOne({ _id: roomId, isActive: true }),
      User.findById(req.auth.userId),
    ]);
    if (!room) return res.status(404).json({ message: "This room is unavailable." });
    if (!user) return res.status(401).json({ message: "Please log in again." });
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > room.capacity) {
      return res.status(400).json({ message: `This room allows up to ${room.capacity} guests.` });
    }

    let reservation = null;
    if (replaceReservationId) {
      if (!mongoose.isValidObjectId(replaceReservationId)) {
        return res.status(400).json({ message: "The reservation to replace is invalid." });
      }
      reservation = await Reservation.findOne({
        _id: replaceReservationId,
        userId: req.auth.userId,
      });
      if (!reservation) return res.status(404).json({ message: "Reservation not found." });
      if (reservation.status !== "pending") {
        return res.status(409).json({ message: "Only pending reservations can be replaced." });
      }
    }

    const overlapQuery = {
      roomId,
      status: { $in: ["pending", "confirmed"] },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    };
    if (reservation) overlapQuery._id = { $ne: reservation._id };

    if (await Reservation.exists(overlapQuery)) {
      return res.status(409).json({ message: "This room already has a pending or confirmed booking for some of those dates." });
    }

    if (reservation) {
      reservation.roomId = room._id;
      reservation.guestName = user.name;
      reservation.email = user.email;
      reservation.checkIn = checkIn;
      reservation.checkOut = checkOut;
      reservation.guestCount = guestCount;
    } else {
      reservation = new Reservation({
        userId: user._id,
        guestName: user.name,
        email: user.email,
        roomId: room._id,
        checkIn,
        checkOut,
        guestCount,
        status: "pending",
      });
    }

    await reservation.save();
    await reservation.populate("roomId", "name type pricePerNight");
    return res.status(replaceReservationId ? 200 : 201).json(reservation);
  } catch (error) {
    return res.status(500).json({ message: "Could not save this reservation." });
  }
});

router.patch("/:id/accept", requireAuth, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid reservation ID." });
  }

  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found." });
    if (reservation.status !== "pending") {
      return res.status(409).json({ message: "Only pending reservations can be accepted." });
    }

    const conflict = await Reservation.exists({
      _id: { $ne: reservation._id },
      roomId: reservation.roomId,
      status: "confirmed",
      checkIn: { $lt: reservation.checkOut },
      checkOut: { $gt: reservation.checkIn },
    });
    if (conflict) {
      return res.status(409).json({ message: "Another confirmed booking overlaps these dates." });
    }

    reservation.status = "confirmed";
    await reservation.save();
    await reservation.populate("roomId", "name type pricePerNight");
    return res.json(reservation);
  } catch (error) {
    return res.status(500).json({ message: "Could not accept this reservation." });
  }
});

router.patch("/:id/cancel", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid reservation ID." });
  }

  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      userId: req.auth.userId,
    });
    if (!reservation) return res.status(404).json({ message: "Reservation not found." });
    if (!["pending", "confirmed"].includes(reservation.status)) {
      return res.status(409).json({ message: "This reservation can no longer be cancelled." });
    }
    if (reservation.checkIn <= new Date()) {
      return res.status(409).json({ message: "Reservations cannot be cancelled on or after check-in." });
    }

    reservation.status = "cancelled";
    await reservation.save();
    await reservation.populate("roomId", "name type pricePerNight");
    return res.json(reservation);
  } catch (error) {
    return res.status(500).json({ message: "Could not cancel this reservation." });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid reservation ID." });
  }

  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      userId: req.auth.userId,
    });
    if (!reservation) return res.status(404).json({ message: "Reservation not found." });
    if (reservation.status !== "pending") {
      return res.status(409).json({ message: "Only pending reservations can be deleted." });
    }

    await reservation.deleteOne();
    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ message: "Could not delete this reservation." });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid reservation ID." });
  }

  try {
    const query = { _id: req.params.id };
    if (req.auth.role !== "admin") query.userId = req.auth.userId;
    const reservation = await Reservation.findOne(query)
      .populate("roomId", "name type pricePerNight");
    if (!reservation) return res.status(404).json({ message: "Reservation not found." });
    return res.json(reservation);
  } catch (error) {
    return res.status(500).json({ message: "Could not load this reservation." });
  }
});

export default router;