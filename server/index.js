require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Models ----------
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
  })
);

const Task = mongoose.model(
  "Task",
  new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      title: { type: String, required: true, trim: true },
      done: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

// ---------- Helpers ----------
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Middleware: checks the JWT and puts the user id on req
const auth = (req, res, next) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ message: "Please log in again" });
  }
};

// ---------- Auth routes ----------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: "Name, email and a 6+ character password are required" });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: signToken(user._id), name: user.name });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.password)))
      return res.status(401).json({ message: "Wrong email or password" });
    res.json({ token: signToken(user._id), name: user.name });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- Task routes (all need login, each user sees only their own) ----------
app.get("/api/tasks", auth, async (req, res) => {
  res.json(await Task.find({ user: req.userId }).sort({ createdAt: -1 }));
});

app.post("/api/tasks", auth, async (req, res) => {
  if (!req.body.title || !req.body.title.trim())
    return res.status(400).json({ message: "Title is required" });
  const task = await Task.create({ user: req.userId, title: req.body.title });
  res.status(201).json(task);
});

app.put("/api/tasks/:id", auth, async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: { title: req.body.title, done: req.body.done } },
    { new: true, omitUndefined: true }
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

app.delete("/api/tasks/:id", auth, async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Deleted" });
});

// ---------- Start ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => console.error("MongoDB connection failed:", err.message));
