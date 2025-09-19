// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import applicationRoutes from "./routes/students/applicationRoutes.js";
import reviewRoutes from "./routes/reviewers/reviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import "./config/cloudinary.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.get("/api/protected", (req, res) => {
  const auth = req.auth();
  res.json({ message: "You are authenticated!", userId: auth.userId });
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/students", applicationRoutes);
app.use("/api/reviewers", reviewRoutes);

const PORT = process.env.PORT || 5000;

// Start server *after* DB connection
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
