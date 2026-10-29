
import "dotenv/config";

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import mongoose from "mongoose";

import connectDB from "./config/db";
import authRoutes from "./routes/auth";
import lostFoundItemsRoutes from "./routes/lostFoundItems";
import aiRoutes from "./routes/ai";

const app = express();

// Allow the deployed frontend and local development frontend.
// Additional origins can be configured through CORS_ORIGIN.
const configuredOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "https://itelect4-project-wine.vercel.app",
  ...configuredOrigins,
].filter((origin, index, origins) => origins.indexOf(origin) === index);

// CORS must run before the API routes and database middleware.
// This also handles browser OPTIONS preflight requests.
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());

// Connect to MongoDB before handling application requests.
// Reuse an existing connection when one is already available.
app.use(async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    next();
  } catch (error) {
    console.error("MongoDB connection error:", error);

    res.status(503).json({
      ok: false,
      db: false,
      message: "Database unavailable",
    });
  }
});

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(dbConnected ? 200 : 503).json({
    ok: dbConnected,
    db: dbConnected,
  });
});

// Application routes
app.use("/api/auth", authRoutes);
app.use("/api/lost-found-items", lostFoundItemsRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Error handler
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("Server error:", err.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
);

// Export the Express app for Vercel.
export default app;

// Start a local server only during development.
if (process.env.NODE_ENV !== "production") {
  const port = Number(process.env.PORT) || 4000;

  app.listen(port, () => {
    console.log(`API on http://localhost:${port}`);
  });
}
