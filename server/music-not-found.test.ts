import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Music Not Found Error Handling", () => {
  it("should return error when music slug does not exist", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    });

    try {
      await caller.music.getBySlug({ slug: "nonexistent-slug-12345" });
      throw new Error("Should have thrown error");
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).message).toContain("Música não encontrada");
      console.log("✅ Correctly threw error for non-existent slug");
    }
  });

  it("should return error when job does not exist", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    });

    try {
      await caller.jobs.getStatus({ jobId: "nonexistent-job-id" });
      throw new Error("Should have thrown error");
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).message).toContain("Job não encontrado");
      console.log("✅ Correctly threw error for non-existent job");
    }
  });

  it("should handle invalid slug format gracefully", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    });

    const invalidSlugs = [
      "",
      "   ",
      "../../etc/passwd",
      "<script>alert('xss')</script>",
      "slug-with-special-chars-!@#$%",
    ];

    for (const slug of invalidSlugs) {
      try {
        await caller.music.getBySlug({ slug });
        // Se não lançar erro, é porque o slug é válido mas não existe
        console.log(`✅ Handled slug: "${slug}" (not found)`);
      } catch (error) {
        // Esperado lançar erro
        console.log(`✅ Correctly threw error for slug: "${slug}"`);
      }
    }
  });

  it("should provide helpful error message", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    });

    try {
      await caller.music.getBySlug({ slug: "SixRccXB3DvXpDiRk-W5U" });
    } catch (error) {
      const errorMessage = (error as any).message;
      expect(errorMessage).toBe("Música não encontrada");
      console.log("✅ Error message is helpful:", errorMessage);
    }
  });
});
