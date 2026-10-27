
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json({ limit: "20kb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({ message: "Resort AI chatbot server is running." });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Please provide a chat message.",
      });
    }

    const safeMessages = messages
      .filter(
        (message) =>
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string"
      )
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 2000),
      }));

    if (!safeMessages.length) {
      return res.status(400).json({
        error: "No valid messages received.",
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5.5",
      instructions: `
        You are a friendly AI assistant for a Resort Booking System.
        Help guests with room information, amenities, booking steps,
        check-in questions, and cancellation questions.

        Be polite, concise, and easy to understand.
        You may answer in English or Cebuano/Bisaya.
        Never invent room prices, availability, or resort policies.
        If information is unavailable, tell the guest to contact
        the resort staff for confirmation.
        Do not claim a booking is confirmed unless the booking
        system has actually confirmed it.
      `,
      input: safeMessages,
    });

    res.json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error("AI chatbot error:", error.message);

    res.status(500).json({
      error: "The AI assistant is temporarily unavailable.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI chatbot server running at http://localhost:${PORT}`);
});
