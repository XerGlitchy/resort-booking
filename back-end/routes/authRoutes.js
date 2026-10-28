import express from "express";
import User from "../models/user.js";
import { createSessionToken, hashPassword, requireAuth, verifyPassword } from "../middleware/auth.js";

const router = express.Router();

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

router.post("/register", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!name || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Enter your name and a valid email address." });
  }
  if (password.length < 8 || password.length > 256) {
    return res.status(400).json({ message: "Password must be between 8 and 256 characters." });
  }

  try {
    const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
    return res.status(201).json({ token: createSessionToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with that email already exists." });
    return res.status(500).json({ message: "Could not create the account." });
  }
});

router.post("/login", async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  try {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }
    return res.json({ token: createSessionToken(user), user: publicUser(user) });
  } catch {
    return res.status(500).json({ message: "Could not log in right now." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(401).json({ message: "Account no longer exists." });
    return res.json({ user: publicUser(user) });
  } catch {
    return res.status(401).json({ message: "Your session is invalid. Please log in again." });
  }
});

export default router;