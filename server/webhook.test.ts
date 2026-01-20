import { describe, it, expect, beforeAll } from "vitest";
import { createJob, getJobById, getSongByJobId } from "./db";
import { handleSunoCallback, webhookHealthCheck } from "./webhook";
import { nanoid } from "nanoid";

describe("Webhook Integration Tests", () => {
  let testJobId: string;

  beforeAll(async () => {
    // Criar um job de teste
    testJobId = nanoid();
    await createJob({
      id: testJobId,
      status: "PROCESSING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Test job created: ${testJobId}`);
  });

  describe("Webhook Callback Processing", () => {
    it("should process valid Suno callback", async () => {
      // Simular callback da Suno API (direct handler call, no HTTP)
      const callbackPayload = {
        jobId: testJobId,
        title: "Música de Teste - Seu Verso",
        lyrics: `Verso 1:
Esta é uma música de teste
Para validar nosso webhook
Tudo funcionando perfeitamente
Seu Verso é o melhor projeto

Pré-refrão:
Teste, teste, teste
Webhook funcionando

Refrão:
Seu Verso, Seu Verso
A melhor plataforma
Gerando músicas com IA
Que transformam histórias em arte`,
        audioUrl: "https://example.com/test-audio.mp3",
      };

      console.log("\n📝 Processing webhook callback directly (no HTTP)...");

      // Mock Express req/res objects
      const req = { body: callbackPayload } as any;
      const res = {
        status: function(code: number) {
          this.statusCode = code;
          return this;
        },
        json: function(data: any) {
          this.data = data;
          return this;
        },
      } as any;

      await handleSunoCallback(req, res);

      const result = res.data;

      console.log("📊 Webhook response:", result);

      expect(res.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("jobId");
      expect(result.data).toHaveProperty("songId");
      expect(result.data).toHaveProperty("shareSlug");
      expect(result.data).toHaveProperty("shareUrl");

      console.log(`✅ Webhook processed successfully`);
      console.log(`   - Song ID: ${result.data.songId}`);
      console.log(`   - Share Slug: ${result.data.shareSlug}`);
      console.log(`   - Share URL: ${result.data.shareUrl}`);
    });

    it("should verify song was saved in database", async () => {
      // Verificar se a música foi salva
      const song = await getSongByJobId(testJobId);

      expect(song).toBeDefined();
      expect(song?.title).toContain("Teste");
      expect(song?.lyrics).toContain("Verso 1");
      expect(song?.audioUrl).toBe("https://example.com/test-audio.mp3");
      expect(song?.shareSlug).toBeTruthy();

      console.log(`✅ Song verified in database:`);
      console.log(`   - Title: ${song?.title}`);
      console.log(`   - Share Slug: ${song?.shareSlug}`);
      console.log(`   - Audio URL: ${song?.audioUrl}`);
    });

    it("should reject invalid payload", async () => {
      const invalidPayloads = [
        {
          name: "Missing jobId",
          payload: {
            title: "Test",
            lyrics: "Test lyrics",
            audioUrl: "https://example.com/audio.mp3",
          },
        },
        {
          name: "Missing title",
          payload: {
            jobId: "test-id",
            lyrics: "Test lyrics",
            audioUrl: "https://example.com/audio.mp3",
          },
        },
        {
          name: "Missing lyrics",
          payload: {
            jobId: "test-id",
            title: "Test",
            audioUrl: "https://example.com/audio.mp3",
          },
        },
        {
          name: "Missing audioUrl",
          payload: {
            jobId: "test-id",
            title: "Test",
            lyrics: "Test lyrics",
          },
        },
      ];

      for (const { name, payload } of invalidPayloads) {
        const req = { body: payload } as any;
        const res = {
          status: function(code: number) {
            this.statusCode = code;
            return this;
          },
          json: function(data: any) {
            this.data = data;
            return this;
          },
        } as any;

        await handleSunoCallback(req, res);

        expect(res.statusCode).toBe(400);
        const result = res.data;
        expect(result.success).toBe(false);
        console.log(`✅ Correctly rejected: ${name}`);
      }
    });

    it("should handle non-existent job", async () => {
      const req = {
        body: {
          jobId: "non-existent-job-xyz",
          title: "Test",
          lyrics: "Test lyrics",
          audioUrl: "https://example.com/audio.mp3",
        },
      } as any;
      const res = {
        status: function(code: number) {
          this.statusCode = code;
          return this;
        },
        json: function(data: any) {
          this.data = data;
          return this;
        },
      } as any;

      await handleSunoCallback(req, res);

      expect(res.statusCode).toBe(404);
      const result = res.data;
      expect(result.success).toBe(false);
      expect(result.error).toContain("Job not found");
      console.log(`✅ Non-existent job handled correctly`);
    });
  });

  describe("Webhook Health Check", () => {
    it("should return health status", async () => {
      const req = {} as any;
      const res = {
        status: function(code: number) {
          this.statusCode = code;
          return this;
        },
        json: function(data: any) {
          this.data = data;
          return this;
        },
      } as any;

      await webhookHealthCheck(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.message).toContain("running");
      console.log(`✅ Webhook health check passed`);
    });
  });

  describe("Webhook URL Information", () => {
    it("should provide webhook URLs", () => {
      const appUrl = process.env.APP_URL || "http://localhost:3000";

      const webhookUrl = `${appUrl}/api/webhook/suno`;
      const healthUrl = `${appUrl}/api/webhook/health`;
      const testUrl = `${appUrl}/api/webhook/test`;

      console.log(`\n📋 Webhook URLs:`);
      console.log(`   - Callback: ${webhookUrl}`);
      console.log(`   - Health: ${healthUrl}`);
      console.log(`   - Test: ${testUrl}`);

      expect(webhookUrl).toContain("/api/webhook/suno");
      expect(healthUrl).toContain("/api/webhook/health");
      expect(testUrl).toContain("/api/webhook/test");
    });
  });
});
