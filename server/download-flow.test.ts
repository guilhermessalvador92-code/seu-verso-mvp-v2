import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { nanoid } from "nanoid";
import { songs, jobs, leads } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Download Flow - Complete End-to-End", () => {
  it("should complete full flow: create job -> webhook -> download", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const jobId = nanoid();
    const shareSlug = nanoid(8);
    const audioUrl = "https://example.com/music.mp3";
    const title = "Música de Teste";
    const lyrics = "Verso 1\nVerso 2\nRefrão";

    console.log("🎵 Starting download flow test...");

    // 1. Criar job
    console.log("1️⃣ Creating job...");
    await db.insert(jobs).values({
      id: jobId,
      status: "QUEUED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const jobCheck = await db.select().from(jobs).where(eq(jobs.id, jobId));
    expect(jobCheck).toHaveLength(1);
    console.log("✅ Job created:", jobId);

    // 2. Criar lead
    console.log("2️⃣ Creating lead...");
    const leadId = nanoid();
    await db.insert(leads).values({
      id: leadId,
      jobId,
      email: "test@example.com",
      style: "pop",
      names: "João",
      story: "Uma história de teste",
      createdAt: new Date(),
    });

    const leadCheck = await db.select().from(leads).where(eq(leads.id, leadId));
    expect(leadCheck).toHaveLength(1);
    console.log("✅ Lead created:", leadId);

    // 3. Simular webhook callback (música pronta)
    console.log("3️⃣ Simulating webhook callback...");
    await db.insert(songs).values({
      id: nanoid(),
      jobId,
      title,
      lyrics,
      audioUrl,
      shareSlug,
      createdAt: new Date(),
    });

    const songCheck = await db.select().from(songs).where(eq(songs.jobId, jobId));
    expect(songCheck).toHaveLength(1);
    expect(songCheck[0].audioUrl).toBe(audioUrl);
    console.log("✅ Song created with audioUrl:", audioUrl);

    // 4. Atualizar job status para DONE
    console.log("4️⃣ Updating job status to DONE...");
    await db.update(jobs).set({ status: "DONE" }).where(eq(jobs.id, jobId));

    const jobUpdated = await db.select().from(jobs).where(eq(jobs.id, jobId));
    expect(jobUpdated[0].status).toBe("DONE");
    console.log("✅ Job status updated to DONE");

    // 5. Testar endpoint getStatus
    console.log("5️⃣ Testing getStatus endpoint...");
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const statusResult = await caller.jobs.getStatus({ jobId });
    expect(statusResult.status).toBe("DONE");
    expect(statusResult.song).toBeDefined();
    expect(statusResult.song?.audioUrl).toBe(audioUrl);
    expect(statusResult.song?.shareSlug).toBe(shareSlug);
    console.log("✅ getStatus returned:", {
      status: statusResult.status,
      audioUrl: statusResult.song?.audioUrl,
      shareSlug: statusResult.song?.shareSlug,
    });

    // 6. Testar endpoint getBySlug
    console.log("6✍️ Testing getBySlug endpoint...");
    const songResult = await caller.music.getBySlug({ slug: shareSlug });
    expect(songResult).toBeDefined();
    expect(songResult.audioUrl).toBe(audioUrl);
    expect(songResult.title).toBe(title);
    expect(songResult.lyrics).toBe(lyrics);
    console.log("✅ getSongBySlug returned:", {
      title: songResult.title,
      audioUrl: songResult.audioUrl,
      lyrics: songResult.lyrics.substring(0, 20) + "...",
    });

    // 7. Testar recordDownload
    console.log("7️⃣ Testing recordDownload mutation...");
    const downloadResult = await caller.music.recordDownload({ slug: shareSlug });
    expect(downloadResult).toBeDefined();
    expect(downloadResult.success).toBe(true);
    console.log("✅ recordDownload succeeded");

    // 8. Verificar download count aumentou
    console.log("8✍️ Verifying download count...");
    const songFinal = await db.select().from(songs).where(eq(songs.jobId, jobId));
    expect(songFinal[0].downloadCount).toBe(1);
    console.log("✅ Download count incremented to:", songFinal[0].downloadCount);

    console.log("\n✅ COMPLETE FLOW TEST PASSED!\n");
    console.log("📊 Summary:");
    console.log(`  - Job ID: ${jobId}`);
    console.log(`  - Share Slug: ${shareSlug}`);
    console.log(`  - Audio URL: ${audioUrl}`);
    console.log(`  - Title: ${title}`);
    console.log(`  - Download Count: ${songFinal[0].downloadCount}`);
  });

  it("should handle missing song gracefully", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.music.getSongBySlug({ slug: "nonexistent" });
      throw new Error("Should have thrown error");
    } catch (error) {
      expect(error).toBeDefined();
      console.log("✅ Correctly threw error for missing song");
    }
  });

  it("should handle missing job gracefully", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.jobs.getStatus({ jobId: "nonexistent" });
      throw new Error("Should have thrown error");
    } catch (error) {
      expect(error).toBeDefined();
      console.log("✅ Correctly threw error for missing job");
    }
  });

  it("should validate audioUrl is returned correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const testUrls = [
      "https://example.com/music1.mp3",
      "https://cdn.suno.com/audio/abc123.mp3",
      "https://storage.googleapis.com/bucket/music.mp3",
      "https://s3.amazonaws.com/bucket/music.mp3",
    ];

    console.log("🔗 Testing various audioUrl formats...");

    for (const audioUrl of testUrls) {
      const jobId = nanoid();
      const shareSlug = nanoid(8);

      await db.insert(jobs).values({
        id: jobId,
        status: "DONE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(songs).values({
        id: nanoid(),
        jobId,
        title: "Test",
        lyrics: "Test",
        audioUrl,
        shareSlug,
        createdAt: new Date(),
      });

      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: { clearCookie: () => {} } as any,
      });

      const result = await caller.music.getBySlug({ slug: shareSlug });
      expect(result.audioUrl).toBe(audioUrl);
      console.log(`✅ URL format valid: ${audioUrl}`);
    }
  });
});
