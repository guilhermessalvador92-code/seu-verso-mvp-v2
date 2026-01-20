import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { jobs, songs, leads } from "../drizzle/schema";

describe("Webhook - Suno API Real Callback", () => {
  let testJobId: string;
  let testLeadId: string;

  beforeAll(async () => {
    // Criar job de teste
    testJobId = "test-job-webhook-" + Date.now();
    testLeadId = "test-lead-webhook-" + Date.now();

    const db = await getDb();
    if (db) {
      await db.insert(jobs).values({
        id: testJobId,
        status: "PROCESSING",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(leads).values({
        id: testLeadId,
        jobId: testJobId,
        email: "test@example.com",
        style: "pop",
        names: "Test User",
        story: "This is a test story",
        createdAt: new Date(),
      });

      console.log("✅ Test job and lead created:", { testJobId, testLeadId });
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    const db = await getDb();
    if (db) {
      try {
        await db.delete(songs).where(eq(songs.jobId, testJobId));
        await db.delete(leads).where(eq(leads.jobId, testJobId));
        await db.delete(jobs).where(eq(jobs.id, testJobId));
        console.log("✅ Test data cleaned up");
      } catch (error) {
        console.error("Failed to clean up test data:", error);
      }
    }
  });

  it("should process Suno callback with complete callbackType", async () => {
    // Simular callback da Suno com estrutura real
    const sunoCallback = {
      code: 200,
      msg: "All generated successfully.",
      data: {
        callbackType: "complete",
        task_id: testJobId,
        data: [
          {
            id: "music-id-123",
            audio_url: "https://cdn.suno.ai/music/test-audio.mp3",
            image_url: "https://cdn.suno.ai/images/test-cover.jpg",
            prompt:
              "[Verse] This is a beautiful test song\n[Chorus] Testing the webhook integration",
            title: "Test Music - Seu Verso",
            tags: "test, webhook, suno",
            model_name: "chirp-v3-5",
            duration: 180.5,
            createTime: new Date().toISOString(),
          },
        ],
      },
    };

    // Chamar webhook handler diretamente
    const mockReq = {
      body: sunoCallback,
    } as any;

    const mockRes = {
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.data = data;
        return this;
      },
      statusCode: 200,
      data: {},
    } as any;

    // Importar handler
    const { handleSunoCallback } = await import("./webhook");
    await handleSunoCallback(mockReq, mockRes);

    // Validar resposta
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.data.success).toBe(true);
    expect(mockRes.data.data.shareSlug).toBeDefined();
    expect(mockRes.data.data.musicUrl).toContain("/m/");

    console.log("✅ Webhook processed successfully:", mockRes.data);

    // Validar que música foi criada no banco
    const db = await getDb();
    if (db) {
      const createdSongs = await db
        .select()
        .from(songs)
        .where(eq(songs.jobId, testJobId));

      expect(createdSongs).toHaveLength(1);
      expect(createdSongs[0]?.title).toBe("Test Music - Seu Verso");
      expect(createdSongs[0]?.audioUrl).toBe(
        "https://cdn.suno.ai/music/test-audio.mp3"
      );
      expect(createdSongs[0]?.imageUrl).toBe(
        "https://cdn.suno.ai/images/test-cover.jpg"
      );
      expect(createdSongs[0]?.duration).toBe(181); // 180.5 rounded
      expect(createdSongs[0]?.tags).toBe("test, webhook, suno");
      expect(createdSongs[0]?.modelName).toBe("chirp-v3-5");
      expect(createdSongs[0]?.shareSlug).toBeDefined();

      console.log("✅ Music created in database:", createdSongs[0]);

      // Validar que job foi atualizado para DONE
      const updatedJob = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, testJobId));

      expect(updatedJob).toHaveLength(1);
      expect(updatedJob[0]?.status).toBe("DONE");

      console.log("✅ Job status updated to DONE");
    }
  });

  it("should handle Suno error callback", async () => {
    const errorJobId = "test-job-error-" + Date.now();

    // Criar job para erro
    const db = await getDb();
    if (db) {
      await db.insert(jobs).values({
        id: errorJobId,
        status: "PROCESSING",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Simular callback de erro da Suno
    const sunoErrorCallback = {
      code: 400,
      msg: "Music generation failed",
      data: {
        callbackType: "error",
        task_id: errorJobId,
        data: null,
      },
    };

    const mockReq = {
      body: sunoErrorCallback,
    } as any;

    const mockRes = {
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.data = data;
        return this;
      },
      statusCode: 200,
      data: {},
    } as any;

    const { handleSunoCallback } = await import("./webhook");
    await handleSunoCallback(mockReq, mockRes);

    // Validar resposta
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.data.success).toBe(false);

    console.log("✅ Error callback handled correctly:", mockRes.data);

    // Validar que job foi marcado como FAILED
    if (db) {
      const failedJob = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, errorJobId));

      expect(failedJob).toHaveLength(1);
      expect(failedJob[0]?.status).toBe("FAILED");

      console.log("✅ Job status updated to FAILED");

      // Limpar
      await db.delete(jobs).where(eq(jobs.id, errorJobId));
    }
  });

  it("should handle multiple music tracks in callback", async () => {
    const multiJobId = "test-job-multi-" + Date.now();

    // Criar job para múltiplas músicas
    const db = await getDb();
    if (db) {
      await db.insert(jobs).values({
        id: multiJobId,
        status: "PROCESSING",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(leads).values({
        id: "test-lead-multi-" + Date.now(),
        jobId: multiJobId,
        email: "multi@example.com",
        style: "rock",
        names: "Multi Test",
        story: "Multi track test",
        createdAt: new Date(),
      });
    }

    // Simular callback com múltiplas músicas
    const sunoMultiCallback = {
      code: 200,
      msg: "All generated successfully.",
      data: {
        callbackType: "complete",
        task_id: multiJobId,
        data: [
          {
            id: "music-1",
            audio_url: "https://cdn.suno.ai/music/track1.mp3",
            image_url: "https://cdn.suno.ai/images/cover1.jpg",
            prompt: "[Verse] First track",
            title: "Track 1",
            tags: "rock",
            model_name: "chirp-v3-5",
            duration: 200,
            createTime: new Date().toISOString(),
          },
          {
            id: "music-2",
            audio_url: "https://cdn.suno.ai/music/track2.mp3",
            image_url: "https://cdn.suno.ai/images/cover2.jpg",
            prompt: "[Verse] Second track",
            title: "Track 2",
            tags: "rock",
            model_name: "chirp-v3-5",
            duration: 210,
            createTime: new Date().toISOString(),
          },
        ],
      },
    };

    const mockReq = {
      body: sunoMultiCallback,
    } as any;

    const mockRes = {
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.data = data;
        return this;
      },
      statusCode: 200,
      data: {},
    } as any;

    const { handleSunoCallback } = await import("./webhook");
    await handleSunoCallback(mockReq, mockRes);

    // Validar que apenas a primeira música foi processada
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.data.success).toBe(true);

    console.log("✅ Multiple tracks callback handled (first track processed)");

    // Validar que apenas primeira música foi criada
    if (db) {
      const createdSongs = await db
        .select()
        .from(songs)
        .where(eq(songs.jobId, multiJobId));

      expect(createdSongs).toHaveLength(1);
      expect(createdSongs[0]?.title).toBe("Track 1");

      console.log("✅ Only first track was saved to database");

      // Limpar
      await db.delete(songs).where(eq(songs.jobId, multiJobId));
      await db.delete(leads).where(eq(leads.jobId, multiJobId));
      await db.delete(jobs).where(eq(jobs.id, multiJobId));
    }
  });
});
