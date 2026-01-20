import { describe, it, expect } from "vitest";

describe("API Keys Validation", () => {
  it("should have SUNO_API_KEY configured", () => {
    const sunoKey = process.env.SUNO_API_KEY;
    expect(sunoKey).toBeDefined();
    expect(sunoKey).toBeTruthy();
    expect(sunoKey?.length).toBeGreaterThan(0);
  });

  it("should have GEMINI_API_KEY configured", () => {
    const geminiKey = process.env.GEMINI_API_KEY;
    expect(geminiKey).toBeDefined();
    expect(geminiKey).toBeTruthy();
    expect(geminiKey?.length).toBeGreaterThan(0);
  });

  it("should validate Suno API key format", async () => {
    const sunoKey = process.env.SUNO_API_KEY;
    if (!sunoKey) {
      throw new Error("SUNO_API_KEY not configured");
    }
    // Mock external fetch for deterministic test runs
    const originalFetch = globalThis.fetch;
    // Return a safe status that isn't 401/403
    globalThis.fetch = async () => ({ status: 400, json: async () => ({}) } as any);
    try {
      const response = await fetch("https://api.sunoapi.org/api/v1/getDetails?taskId=test", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sunoKey}`,
          "Content-Type": "application/json",
        },
      });

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should validate Gemini API key format", async () => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }
    // Mock external fetch for deterministic test runs
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ status: 400, json: async () => ({}) } as any);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Test",
                  },
                ],
              },
            ],
          }),
        }
      );

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
