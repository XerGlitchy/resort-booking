import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { randomBytes } from "crypto";

import roomRoutes from "./routes/roomRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import User from "./models/user.js";
import Room from "./models/room.js";
import { hashPassword } from "./middleware/auth.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test GET route
app.get("/", (req, res) => {
  res.send("Resort Booking API is running!");
});

// API routes
app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api", chatRoutes);

// Start server after MongoDB connects
const PORT = process.env.API_PORT || 5000;

async function startServer() {
  try {
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Set AUTH_SECRET to a random value of at least 32 characters in back-end/.env.");
      }

      process.env.AUTH_SECRET = randomBytes(48).toString("base64url");
      console.warn("AUTH_SECRET is missing or too short; using a temporary development secret. Sessions will expire when the server restarts.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    if (!(await Room.exists({}))) {
      await Room.insertMany([
        {
          name: "Deluxe Room",
          type: "Deluxe",
          pricePerNight: 2500,
          capacity: 2,
          description: "Comfortable room for couples or solo travelers.",
        },
        {
          name: "Family Villa",
          type: "Villa",
          pricePerNight: 4500,
          capacity: 4,
          description: "Spacious accommodation for family vacations.",
        },
        {
          name: "Ocean View Suite",
          type: "Suite",
          pricePerNight: 3500,
          capacity: 2,
          description: "Relax and enjoy a peaceful resort getaway.",
        },
      ]);
      console.log("Added the default resort room catalog");
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail || adminPassword) {
      if (!adminEmail || !adminPassword || adminPassword.length < 8) {
        throw new Error("Set both ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters.");
      }

      const existingAdmin = await User.findOne({ email: adminEmail });
      const passwordHash = await hashPassword(adminPassword);
      if (!existingAdmin) {
        await User.create({
          name: "Resort Administrator",
          email: adminEmail,
          passwordHash,
          role: "admin",
        });
        console.log("Admin account provisioned from ADMIN_EMAIL");
      } else {
        existingAdmin.role = "admin";
        existingAdmin.passwordHash = passwordHash;
        await existingAdmin.save();
        console.log("Admin account synchronized from ADMIN_EMAIL and ADMIN_PASSWORD");
      }
    } else {
      console.warn("No admin account is configured. Add ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters to back-end/.env, then restart the backend.");
    }

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();