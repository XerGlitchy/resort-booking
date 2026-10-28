import express from "express";
import { OpenRouter } from "@openrouter/sdk";
import Room from "../models/room.js";

const router = express.Router();
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 2000;

router.post("/chat", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "OpenRouter is not configured. Add OPENROUTER_API_KEY to back-end/.env and restart the backend.",
    });
  }

  const messages = Array.isArray(req.body?.messages)
    ? req.body.messages
      .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message.content === "string")
      .slice(-MAX_MESSAGES)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, MAX_MESSAGE_LENGTH),
      }))
    : [];

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Please provide a chat message." });
  }

  try {
    const rooms = await Room.find({ isActive: true }).select("name type pricePerNight capacity description");
    const roomDetails = rooms.length
      ? rooms.map((room) => `${room.name} (${room.type}): ₱${room.pricePerNight.toLocaleString()} per night, up to ${room.capacity} guests. ${room.description || ""}`).join("\n")
      : "No room information is currently available.";

    const client = new OpenRouter({
      apiKey,
      httpReferer: process.env.OPENROUTER_HTTP_REFERER || "http://localhost:5173",
      appTitle: process.env.OPENROUTER_APP_TITLE || "Island Resort Booking",
    });
    const completion = await client.chat.send({
      chatRequest: {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a friendly, concise assistant for Island Resort. Reply in the language the guest uses, including Cebuano/Bisaya when appropriate. Use only these verified room facts:\n${roomDetails}\n\nNever invent availability, check-in policies, amenities, prices, or a guest's private reservation details. Availability is checked when the booking form is submitted. Direct guests to My Reservations for their personal bookings and to resort staff for policies not listed here. Never claim a booking is confirmed; new bookings are pending until an administrator accepts them.`,
          },
          ...messages,
        ],
      },
    });

    const content = completion.choices?.[0]?.message?.content;
    const reply = typeof content === "string"
      ? content.trim()
      : Array.isArray(content)
        ? content.map((part) => typeof part.text === "string" ? part.text : "").join(" ").trim()
        : "";

    if (!reply) return res.status(502).json({ error: "OpenRouter returned an empty response. Please try again." });
    return res.json({ reply });
  } catch (error) {
    console.error("OpenRouter chat error:", error.message);
    return res.status(502).json({ error: "The AI assistant could not respond right now. Please try again." });
  }
});

export default router;