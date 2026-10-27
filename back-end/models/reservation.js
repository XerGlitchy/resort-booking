import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  email: { type: String, required: true },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guestCount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("Reservation", reservationSchema);