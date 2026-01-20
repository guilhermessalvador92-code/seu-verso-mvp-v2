import { describe, it, expect, beforeAll } from "vitest";
import { queueEmail, processEmailQueue, getEmailStatus, getEmailQueueStats, startEmailQueueWorker, stopEmailQueueWorker } from "./email-retry";
import { getDb } from "./db";
import { emailQueue } from "../drizzle/schema";

describe("Email Retry System", () => {
  describe("Queue Management", () => {
    it("should queue an email", async () => {
      const emailId = await queueEmail({
        to: "test@example.com",
        subject: "Test Email",
        htmlContent: "<p>Test content</p>",
        type: "NOTIFICATION",
      });

      expect(emailId).toBeTruthy();
      expect(emailId.length).toBeGreaterThan(0);

      console.log(`✅ Email queued: ${emailId}`);
    });

    it("should retrieve email status", async () => {
      const emailId = await queueEmail({
        to: "status@example.com",
        subject: "Status Test",
        htmlContent: "<p>Test</p>",
        type: "NOTIFICATION",
      });

      const status = await getEmailStatus(emailId);

      expect(status).toBeDefined();
      expect(status?.id).toBe(emailId);
      expect(status?.status).toBe("PENDING");
      expect(status?.attempts).toBe(0);
      expect(status?.to).toBe("status@example.com");

      console.log(`✅ Email status retrieved:`, {
        id: status?.id,
        status: status?.status,
        attempts: status?.attempts,
      });
    });

    it("should queue multiple emails", async () => {
      const emails = [
        { to: "user1@example.com", subject: "Email 1" },
        { to: "user2@example.com", subject: "Email 2" },
        { to: "user3@example.com", subject: "Email 3" },
      ];

      const emailIds = await Promise.all(
        emails.map(email =>
          queueEmail({
            to: email.to,
            subject: email.subject,
            htmlContent: "<p>Content</p>",
            type: "NOTIFICATION",
          })
        )
      );

      expect(emailIds).toHaveLength(3);
      emailIds.forEach(id => {
        expect(id).toBeTruthy();
      });

      console.log(`✅ Multiple emails queued: ${emailIds.length}`);
    });
  });

  describe("Queue Statistics", () => {
    it("should get queue statistics", async () => {
      const stats = await getEmailQueueStats();

      expect(stats).toHaveProperty("pending");
      expect(stats).toHaveProperty("sent");
      expect(stats).toHaveProperty("failed");
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("oldestPending");

      expect(typeof stats.pending).toBe("number");
      expect(typeof stats.sent).toBe("number");
      expect(typeof stats.failed).toBe("number");
      expect(typeof stats.total).toBe("number");

      console.log(`✅ Queue statistics:`, {
        pending: stats.pending,
        sent: stats.sent,
        failed: stats.failed,
        total: stats.total,
      });
    });
  });

  describe("Retry Configuration", () => {
    it("should use default retry config", async () => {
      const emailId = await queueEmail({
        to: "retry@example.com",
        subject: "Retry Test",
        htmlContent: "<p>Test</p>",
        type: "NOTIFICATION",
      });

      const status = await getEmailStatus(emailId);

      expect(status?.maxAttempts).toBe(5);
      expect(status?.attempts).toBe(0);
      expect(status?.nextRetryAt).toBeDefined();

      console.log(`✅ Default retry config applied:`, {
        maxAttempts: status?.maxAttempts,
        nextRetryAt: status?.nextRetryAt,
      });
    });

    it("should use custom retry config", async () => {
      const customConfig = {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
      };

      const emailId = await queueEmail(
        {
          to: "custom@example.com",
          subject: "Custom Config",
          htmlContent: "<p>Test</p>",
          type: "NOTIFICATION",
        },
        customConfig
      );

      const status = await getEmailStatus(emailId);

      expect(status?.maxAttempts).toBe(3);
      console.log(`✅ Custom retry config applied: maxAttempts = ${status?.maxAttempts}`);
    });
  });

  describe("Email Types", () => {
    it("should support all email types", async () => {
      const types = ["ORDER_CONFIRMATION", "MUSIC_READY", "NOTIFICATION"] as const;

      for (const type of types) {
        const emailId = await queueEmail({
          to: `${type}@example.com`,
          subject: `Test ${type}`,
          htmlContent: "<p>Test</p>",
          type,
        });

        const status = await getEmailStatus(emailId);
        expect(status?.type).toBe(type);
        console.log(`✅ Email type "${type}" queued successfully`);
      }
    });
  });

  describe("Job Association", () => {
    it("should associate email with job", async () => {
      const jobId = "test-job-123";

      const emailId = await queueEmail({
        to: "job@example.com",
        subject: "Job Email",
        htmlContent: "<p>Test</p>",
        type: "MUSIC_READY",
        jobId,
      });

      const status = await getEmailStatus(emailId);

      expect(status?.jobId).toBe(jobId);
      console.log(`✅ Email associated with job: ${jobId}`);
    });
  });

  describe("Worker Management", () => {
    it("should start and stop email queue worker", async () => {
      const timer = startEmailQueueWorker(5000);

      expect(timer).toBeDefined();
      console.log(`✅ Email queue worker started`);

      stopEmailQueueWorker(timer);
      console.log(`✅ Email queue worker stopped`);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle order confirmation email flow", async () => {
      const jobId = "order-123";
      const email = "customer@example.com";
      const recipientName = "João";

      // Simular enfileiramento de email de confirmação
      const emailId = await queueEmail({
        to: email,
        subject: `🎵 Sua música está sendo criada - Seu Verso`,
        htmlContent: `<p>Olá,</p><p>Recebemos sua solicitação para criar uma música personalizada para <strong>${recipientName}</strong>!</p>`,
        type: "ORDER_CONFIRMATION",
        jobId,
      });

      expect(emailId).toBeTruthy();

      const status = await getEmailStatus(emailId);
      expect(status?.type).toBe("ORDER_CONFIRMATION");
      expect(status?.jobId).toBe(jobId);
      expect(status?.status).toBe("PENDING");

      console.log(`✅ Order confirmation email flow:`, {
        emailId,
        jobId,
        status: status?.status,
      });
    });

    it("should handle music ready email flow", async () => {
      const jobId = "music-456";
      const email = "user@example.com";
      const musicTitle = "Música para João";
      const shareSlug = "abc123xyz";

      // Simular enfileiramento de email de música pronta
      const emailId = await queueEmail({
        to: email,
        subject: `🎵 Sua música "${musicTitle}" está pronta!`,
        htmlContent: `<p>Sua música foi criada com sucesso!</p><p><a href="https://seu-verso.com/m/${shareSlug}">Ouvir Minha Música</a></p>`,
        type: "MUSIC_READY",
        jobId,
      });

      expect(emailId).toBeTruthy();

      const status = await getEmailStatus(emailId);
      expect(status?.type).toBe("MUSIC_READY");
      expect(status?.jobId).toBe(jobId);

      console.log(`✅ Music ready email flow:`, {
        emailId,
        jobId,
        musicTitle,
        shareSlug,
      });
    });
  });

  describe("Queue Processing", () => {
    it("should process email queue", async () => {
      // Enfileirar alguns emails
      await queueEmail({
        to: "process1@example.com",
        subject: "Process Test 1",
        htmlContent: "<p>Test</p>",
        type: "NOTIFICATION",
      });

      await queueEmail({
        to: "process2@example.com",
        subject: "Process Test 2",
        htmlContent: "<p>Test</p>",
        type: "NOTIFICATION",
      });

      console.log(`✅ Emails queued for processing`);

      // Processar fila
      await processEmailQueue();

      console.log(`✅ Email queue processed`);

      // Verificar estatísticas
      const stats = await getEmailQueueStats();
      console.log(`✅ Queue stats after processing:`, {
        pending: stats.pending,
        sent: stats.sent,
        failed: stats.failed,
        total: stats.total,
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid email gracefully", async () => {
      try {
        await queueEmail({
          to: "invalid-email",
          subject: "Invalid Email Test",
          htmlContent: "<p>Test</p>",
          type: "NOTIFICATION",
        });

        console.log(`✅ Invalid email queued (validation happens at send time)`);
      } catch (error) {
        console.log(`✅ Error caught:`, error instanceof Error ? error.message : error);
      }
    });

    it("should handle missing required fields", async () => {
      try {
        await queueEmail({
          to: "",
          subject: "",
          htmlContent: "",
          type: "NOTIFICATION",
        });

        console.log(`✅ Empty email queued (validation happens at send time)`);
      } catch (error) {
        console.log(`✅ Error caught:`, error instanceof Error ? error.message : error);
      }
    });
  });
});
