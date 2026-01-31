import { describe, it, expect } from "vitest";

describe("API Credentials Validation", () => {
  it("should have valid Gemini API key", async () => {
    const geminiKey = process.env.GEMINI_API_KEY;
    expect(geminiKey).toBeDefined();
    expect(geminiKey).toMatch(/^AIzaSy/); // Gemini keys start with AIzaSy
  });

  it("should have valid Suno API key", async () => {
    const sunoKey = process.env.SUNO_API_KEY;
    expect(sunoKey).toBeDefined();
    expect(sunoKey?.length).toBeGreaterThan(20); // Suno keys are long hex strings
  });

  it("should test Gemini API connectivity", async () => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("Skipping Gemini test - no API key");
      return;
    }

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Say 'test'",
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      
      // Check if response is valid (either success or expected error)
      expect(response.status).toBeLessThan(500); // Should not be server error
      
      if (response.status === 200) {
        expect(data.candidates).toBeDefined();
        console.log("✅ Gemini API key is valid");
      } else if (response.status === 400) {
        // 400 is expected for invalid key format
        if (data.error?.message?.includes("API key")) {
          throw new Error("Invalid Gemini API key");
        }
      }
    } catch (error) {
      console.error("Gemini API test error:", error);
      throw error;
    }
  });

  it("should test Suno API connectivity", async () => {
    const sunoKey = process.env.SUNO_API_KEY;
    if (!sunoKey) {
      console.warn("Skipping Suno test - no API key");
      return;
    }

    try {
      // Test with a simple fetch to the Suno API health/info endpoint
      const response = await fetch("https://api.sunoapi.org/api/v1/fetch?ids=test", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sunoKey}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      // Suno API returns 200 even for invalid task IDs, but with specific error message
      if (response.status === 200) {
        // Valid key - API responded
        console.log("✅ Suno API key is valid");
        expect(data).toBeDefined();
      } else if (response.status === 401) {
        throw new Error("Invalid Suno API key - 401 Unauthorized");
      } else if (response.status === 403) {
        throw new Error("Invalid Suno API key - 403 Forbidden");
      }
    } catch (error) {
      console.error("Suno API test error:", error);
      throw error;
    }
  });
});
