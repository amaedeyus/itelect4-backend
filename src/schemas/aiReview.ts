
import { z } from "zod";

// The client must send a prompt between 20 and 2000
// characters AFTER trimming surrounding whitespace.
export const aiRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(20, "The report must contain at least 20 characters.")
    .max(2000, "The report must not exceed 2000 characters."),
});

export type AiRequest = z.infer<typeof aiRequestSchema>;

// The only reply shape accepted by the application.
export const aiReplySchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1),
  improvements: z.array(z.string().min(1)).min(1),
  readiness: z.enum(["ready", "almost", "not-yet"]),
});

export type AiReply = z.infer<typeof aiReplySchema>;

// JSON Schema is sent to Gemini to request structured JSON.
export const aiReplyJsonSchema = z.toJSONSchema(aiReplySchema);
