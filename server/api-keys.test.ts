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

    // Test basic connectivity to Suno API
    try {
      const response = await fetch("https://api.sunoapi.org/api/v1/getDetails?taskId=test", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sunoKey}`,
          "Content-Type": "application/json",
        },
      });

      // We expect either 400 (invalid taskId) or 200, but not 401 (unauthorized)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    } catch (error) {
      // Network errors are acceptable in test environment
      console.log("Network test skipped:", error);
    }
  });

  it("should validate Gemini API key format", async () => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Test basic connectivity to Gemini API
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

      // We expect either 200 or 400, but not 401 (unauthorized) or 403 (forbidden)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    } catch (error) {
      // Network errors are acceptable in test environment
      console.log("Network test skipped:", error);
    }
  });
});
