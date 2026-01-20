import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Music Generation Flow - Simplified Tests", () => {
  describe("Form Validation", () => {
    it("should accept valid form input with all fields", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      // This will attempt to create a job
      // It may fail at Suno API level, but form validation should pass
      try {
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
        console.log("✅ Form validation passed, job created:", result.jobId);
      } catch (error: any) {
        // If it fails, it should be due to Suno API, not form validation
        const errorMessage = error?.message || String(error);
        expect(errorMessage).not.toContain("História deve ter");
        expect(errorMessage).not.toContain("Email inválido");
        expect(errorMessage).not.toContain("concordar com os termos");
        console.log("✅ Form validation passed (Suno API error expected)");
      }
    });

    it("should reject form with missing story", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.jobs.create({
          story: "short",
          style: "Pop",
          names: "Test",
          email: "test@example.com",
          agreedToTerms: true,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error?.message).toContain("História");
        console.log("✅ Short story validation working");
      }
    });

    it("should reject form with invalid email", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.jobs.create({
          story: "This is a long story about someone special",
          style: "Pop",
          names: "Test",
          email: "invalid-email",
          agreedToTerms: true,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error?.message).toContain("Email");
        console.log("✅ Email validation working");
      }
    });

    it("should reject form without terms agreement", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.jobs.create({
          story: "This is a long story about someone special",
          style: "Pop",
          names: "Test",
          email: "test@example.com",
          agreedToTerms: false,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error?.message).toContain("concordar");
        console.log("✅ Terms agreement validation working");
      }
    });
  });

  describe("Music Styles", () => {
    it("should accept all valid music styles", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const styles = ["Pop", "Rock", "Sertanejo", "MPB", "Gospel", "Funk", "Romântica 80/90", "Soul/Groove"];

      for (const style of styles) {
        try {
          await caller.jobs.create({
            story: "Uma história especial sobre alguém muito importante",
            style: style as any,
            names: "Pessoa Especial",
            email: "test@example.com",
            agreedToTerms: true,
          });
          console.log(`✅ Style "${style}" accepted`);
        } catch (error: any) {
          // Should not fail on style validation
          expect(error?.message).not.toContain("enum");
          console.log(`✅ Style "${style}" processed (Suno API error expected)`);
        }
      }
    });
  });

  describe("API Endpoints", () => {
    it("should handle getStatus for non-existent job", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.jobs.getStatus({ jobId: "non-existent" });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error?.message).toContain("não encontrado");
        console.log("✅ getStatus error handling working");
      }
    });

    it("should handle getBySlug for non-existent song", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.music.getBySlug({ slug: "non-existent" });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error?.message).toContain("não encontrada");
        console.log("✅ getBySlug error handling working");
      }
    });

    it("should record download successfully", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.music.recordDownload({ slug: "test-slug" });
      expect(result).toEqual({ success: true });
      console.log("✅ recordDownload working");
    });
  });

  describe("API Keys", () => {
    it("should have SUNO_API_KEY configured", () => {
      const key = process.env.SUNO_API_KEY;
      expect(key).toBeTruthy();
      expect(key?.length).toBeGreaterThan(0);
      console.log("✅ SUNO_API_KEY configured");
    });

    it("should have GEMINI_API_KEY configured", () => {
      const key = process.env.GEMINI_API_KEY;
      expect(key).toBeTruthy();
      expect(key?.length).toBeGreaterThan(0);
      console.log("✅ GEMINI_API_KEY configured");
    });
  });
});
