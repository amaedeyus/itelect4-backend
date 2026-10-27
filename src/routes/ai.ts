
import { Router, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";

import auth from "../middleware/auth";
import { aiRequestSchema } from "../schemas/aiReview";
import { reviewReport } from "../ai/gemini";

const router = Router();

// The user must be authenticated before the rate limiter runs.
// The limit is tracked by verified user ID, not by IP address.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req) => req.userId ?? "unknown-user",
  handler: (_req, res) => {
    res.status(429).json({
      message:
        "You've reached your AI review limit. Please wait a minute and try again.",
    });
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as {
    status?: number;
    code?: number | string;
    message?: string;
    error?: {
      status?: string;
      message?: string;
    };
  };

  const statusText = err.error?.status ?? "";
  const message =
    `${err.message ?? ""} ${err.error?.message ?? ""}`.toLowerCase();

  return (
    err.status === 429 ||
    err.code === 429 ||
    statusText === "RESOURCE_EXHAUSTED" ||
    message.includes("quota exceeded") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit")
  );
}

// POST /api/ai
router.post("/", auth, aiLimiter, async (
  req: Request,
  res: Response
) => {
  // Reject invalid input before spending a Gemini request.
  const input = aiRequestSchema.safeParse(req.body);

  if (!input.success) {
    res.status(400).json({
      message:
        "Please provide an item report between 20 and 2000 characters.",
    });
    return;
  }

  try {
    const review = await reviewReport(input.data.prompt);

    res.status(200).json(review);
  } catch (error) {
    if (isQuotaError(error)) {
      res.status(429).json({
        message:
          "The AI review service has reached its usage quota. Please try again later.",
      });
      return;
    }

    console.error("AI review error:", error);

    res.status(502).json({
      message:
        "The AI review service could not return a valid review. Please try again.",
    });
  }
});

export default router;
