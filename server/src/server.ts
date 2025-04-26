import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";

// Load environment variables
dotenv.config();

// Import middleware
import rawBodyMiddleware from "./middlewares/rawBodyMiddleware";

// Import routes
import fileRoutes from "./routes/fileRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";

// Import Passport config
import configurePassport from "./config/passport";

// Create Express app
const app = express();

// Define Error interface
interface ErrorWithStack extends Error {
  stack?: string;
}

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
  })
);

// Add raw body middleware before JSON parsing
app.use(rawBodyMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/fileSharingApp";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/files", fileRoutes);
app.use("/api/payments", paymentRoutes);

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.send("File Sharing API is running");
});

// Session configuration (for Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
// app.use(passport.session()); // Uncomment if you want to use sessions

// Configure Passport strategies
configurePassport();
app.use("/api/admin", adminRoutes);

app.use("/api/auth", authRoutes);

// Error handler middleware
app.use(
  (err: ErrorWithStack, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: err.message });
  }
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
