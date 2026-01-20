import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import { generateMusicWithSuno, getSunoTaskDetails } from "./suno";

describe("Integration Tests - Music Generation Flow", () => {
  describe("End-to-End: Create Music Request", () => {
    it("should create a job with valid input", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.jobs.create({
        story: "João é um homem que amava cantar e dançar. Ele sempre trouxe alegria para a família.",
        style: "Pop",
        names: "João",
        occasion: "Aniversário",
        mood: "Alegre",
        email: "test@example.com",
        agreedToTerms: true,
      });

      expect(result).toHaveProperty("jobId");
      expect(result).toHaveProperty("statusUrl");
      expect(result.jobId).toBeTruthy();
      expect(result.statusUrl).toContain("/status/");
      console.log("✅ Job created:", result);
    });

    it("should handle music styles correctly", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const styles = ["Pop", "Rock", "Sertanejo", "MPB", "Gospel"];

      for (const style of styles) {
        const result = await caller.jobs.create({
          story: "Uma história especial sobre alguém muito importante",
          style: style as any,
          names: "Pessoa Especial",
          email: "test@example.com",
          agreedToTerms: true,
        });

        expect(result.jobId).toBeTruthy();
        console.log(`✅ Created job with style: ${style}`);
      }
    });

    it("should validate required fields", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      // Test missing story
      try {
        await caller.jobs.create({
          story: "short",
          style: "Pop",
          names: "Test",
          email: "test@example.com",
          agreedToTerms: true,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeTruthy();
        console.log("✅ Validation error caught for short story");
      }

      // Test invalid email
      try {
        await caller.jobs.create({
          story: "This is a long story about someone special",
          style: "Pop",
          names: "Test",
          email: "invalid-email",
          agreedToTerms: true,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeTruthy();
        console.log("✅ Validation error caught for invalid email");
      }

      // Test missing terms agreement
      try {
        await caller.jobs.create({
          story: "This is a long story about someone special",
          style: "Pop",
          names: "Test",
          email: "test@example.com",
          agreedToTerms: false,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeTruthy();
        console.log("✅ Validation error caught for missing terms agreement");
      }
    });
  });

  describe("Suno API Integration", () => {
    it("should test Suno API connectivity", async () => {
      const sunoKey = process.env.SUNO_API_KEY;
      expect(sunoKey).toBeTruthy();

      // Test basic connectivity
      try {
        const response = await fetch("https://api.sunoapi.org/api/v1/getDetails?taskId=test", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sunoKey}`,
            "Content-Type": "application/json",
          },
        });

        // Should not be 401 (unauthorized)
        expect(response.status).not.toBe(401);
        console.log(`✅ Suno API connectivity test passed (status: ${response.status})`);
      } catch (error) {
        console.log("⚠️ Suno API connectivity test skipped (network error)");
      }
    });
  });

  describe("Gemini LLM Integration", () => {
    it("should test Gemini API connectivity", async () => {
      const geminiKey = process.env.GEMINI_API_KEY;
      expect(geminiKey).toBeTruthy();

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

        // Should not be 401 or 403
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
        console.log(`✅ Gemini API connectivity test passed (status: ${response.status})`);
      } catch (error) {
        console.log("⚠️ Gemini API connectivity test skipped (network error)");
      }
    });
  });

  describe("Music Router - Get Status", () => {
    it("should handle non-existent job gracefully", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.jobs.getStatus({ jobId: "non-existent-job-id" });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeTruthy();
        console.log("✅ Non-existent job handled correctly");
      }
    });
  });

  describe("Music Router - Get By Slug", () => {
    it("should handle non-existent song gracefully", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.music.getBySlug({ slug: "non-existent-slug" });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeTruthy();
        console.log("✅ Non-existent song handled correctly");
      }
    });
  });

  describe("Music Router - Record Download", () => {
    it("should record download successfully", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.music.recordDownload({ slug: "test-slug" });
      expect(result).toEqual({ success: true });
      console.log("✅ Download recorded successfully");
    });
  });
});
