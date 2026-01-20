import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { MUSIC_STYLES, MOODS } from "@shared/types";

describe("jobs router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      // Missing story
      await expect(
        caller.jobs.create({
          story: "short",
          style: "Pop",
          names: "João",
          email: "test@example.com",
          agreedToTerms: true,
        })
      ).rejects.toThrow();

      // Invalid email
      await expect(
        caller.jobs.create({
          story: "This is a long story about someone special",
          style: "Pop",
          names: "João",
          email: "invalid-email",
          agreedToTerms: true,
        })
      ).rejects.toThrow();

      // Missing terms agreement
      await expect(
        caller.jobs.create({
          story: "This is a long story about someone special",
          style: "Pop",
          names: "João",
          email: "test@example.com",
          agreedToTerms: false,
        })
      ).rejects.toThrow();
    });

    it("should accept valid music styles", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      for (const style of MUSIC_STYLES) {
        const result = await caller.jobs.create({
          story: "This is a long story about someone special",
          style,
          names: "João",
          email: "test@example.com",
          agreedToTerms: true,
        });

        expect(result).toHaveProperty("jobId");
        expect(result).toHaveProperty("statusUrl");
        expect(result.statusUrl).toContain("/status/");
      }
    });

    it("should accept optional mood field", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      for (const mood of MOODS) {
        const result = await caller.jobs.create({
          story: "This is a long story about someone special",
          style: "Pop",
          names: "João",
          mood,
          email: "test@example.com",
          agreedToTerms: true,
        });

        expect(result).toHaveProperty("jobId");
      }
    });

    it("should accept optional occasion field", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.jobs.create({
        story: "This is a long story about someone special",
        style: "Pop",
        names: "João",
        occasion: "Birthday",
        email: "test@example.com",
        agreedToTerms: true,
      });

      expect(result).toHaveProperty("jobId");
    });
  });

  describe("getStatus", () => {
    it("should throw error for non-existent job", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.jobs.getStatus({ jobId: "non-existent-job-id" })
      ).rejects.toThrow("Job não encontrado");
    });
  });

  describe("getSongBySlug", () => {
    it("should throw error for non-existent song", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.jobs.getSongBySlug({ slug: "non-existent-slug" })
      ).rejects.toThrow("Música não encontrada");
    });
  });

  describe("music router", () => {
    it("should throw error for non-existent song in getBySlug", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.music.getBySlug({ slug: "non-existent-slug" })
      ).rejects.toThrow("Música não encontrada");
    });

    it("should handle recordDownload", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.music.recordDownload({ slug: "test-slug" });
      expect(result).toEqual({ success: true });
    });
  });
});
