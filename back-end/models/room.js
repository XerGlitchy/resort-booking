import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
  capacity: { type: Number, required: true },
  description: String,
  isActive: { type: Boolean, default: true }
});

export default mongoose.model("Room", roomSchema);