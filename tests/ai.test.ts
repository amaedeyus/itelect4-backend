
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../src/config/db", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

import app from "../src/server";

const TEST_SECRET = "gt6-test-secret";

function tokenFor(userId: string): string {
  return jwt.sign({ userId }, TEST_SECRET, {
    expiresIn: "1h",
  });
}

beforeAll(() => {
  vi.stubEnv("JWT_SECRET", TEST_SECRET);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/ai authentication", () => {
  it("returns 401 when no token is supplied", async () => {
    const response = await request(app)
      .post("/api/ai")
      .send({ prompt: "A sufficiently long sample item report." });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Authentication required. Provide a Bearer token."
    );
  });

  it("returns 401 when the token is invalid", async () => {
    const response = await request(app)
      .post("/api/ai")
      .set("Authorization", "Bearer invalid-token")
      .send({ prompt: "A sufficiently long sample item report." });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Invalid or expired authentication token."
    );
  });

  it("allows a valid token past auth and reaches input validation", async () => {
    const token = tokenFor("gt6-test-user");

    const response = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${token}`)
      .send({ prompt: "Too short" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Please provide an item report between 20 and 2000 characters."
    );
  });
});
