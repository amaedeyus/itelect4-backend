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

const app = express();

app.use(cors());
app.use(express.json());

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

// Start only after MongoDB connects
const startServer = async (): Promise<void> => {
try {
await connectDB();


const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


} catch (error) {
console.error("Unable to start server:", error);
process.exit(1);
}
};

void startServer();
