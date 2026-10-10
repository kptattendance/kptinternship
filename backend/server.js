// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import applicationRoutes from "./routes/students/applicationRoutes.js";
import reviewRoutes from "./routes/reviewers/reviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import "./config/cloudinary.js";
import connectDB from "./config/db.js";
import yearStatisticsRoutes from "./routes/yearStatisticsRoutes.js";

dotenv.config();

// Set CORS_ORIGINS (comma separated) to allow only the listed websites,
// e.g. CORS_ORIGINS=https://intern.kptmangaluru.in
// When it is not set, every origin is allowed (previous behaviour).
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.disable("x-powered-by");
app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins } : {}));
app.use(express.json({ limit: "1mb" }));
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
app.use("/api/company", companyRoutes);
app.use("/api/yearStatistics", yearStatisticsRoutes);

const PORT = process.env.PORT || 5000;

// Start server *after* DB connection
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
