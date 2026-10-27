
import { GoogleGenAI, type Content } from "@google/genai";

import {
  aiReplyJsonSchema,
  aiReplySchema,
  type AiReply,
} from "../schemas/aiReview";

import {
  EXAMPLES,
  MODEL,
  SYSTEM_PROMPT,
  wrap,
} from "./prompt";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (client === null) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
}

function buildContents(prompt: string): Content[] {
  const contents: Content[] = [];

  for (const example of EXAMPLES) {
    contents.push({
      role: "user",
      parts: [{ text: wrap(example.prompt) }],
    });

    contents.push({
      role: "model",
      parts: [{ text: JSON.stringify(example.reply) }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: wrap(prompt) }],
  });

  return contents;
}

export async function reviewReport(
  prompt: string
): Promise<AiReply> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildContents(prompt),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: aiReplyJsonSchema,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  const result = aiReplySchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("Gemini returned an invalid reply.");
  }

  return result.data;
}
