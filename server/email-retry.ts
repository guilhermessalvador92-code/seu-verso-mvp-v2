/**
 * Email Retry System with Exponential Backoff
 * Handles reliable email delivery with automatic retries
 */

import { getDb } from "./db";
import { emailQueue, InsertEmailQueue, EmailQueue } from "../drizzle/schema";
import { eq, and, lt, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendEmail } from "./email";

export interface EmailRetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_CONFIG: EmailRetryConfig = {
  maxAttempts: 5,
  initialDelayMs: 5000, // 5 segundos
  maxDelayMs: 3600000, // 1 hora
  backoffMultiplier: 2,
};

/**
 * Calcular delay para próxima tentativa usando backoff exponencial
 */
function calculateNextRetryDelay(attempts: number, config: EmailRetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempts);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Adicionar email à fila para envio
 */
export async function queueEmail(
  email: Omit<InsertEmailQueue, "id" | "createdAt" | "updatedAt" | "attempts" | "status" | "nextRetryAt" | "lastError" | "sentAt">,
  config: EmailRetryConfig = DEFAULT_CONFIG
): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const emailId = nanoid();
  const nextRetryAt = new Date(Date.now() + config.initialDelayMs);

  try {
    await db.insert(emailQueue).values({
      id: emailId,
      to: email.to,
      subject: email.subject,
      htmlContent: email.htmlContent,
      type: email.type,
      jobId: email.jobId,
      status: "PENDING",
      attempts: 0,
      maxAttempts: config.maxAttempts,
      nextRetryAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("[EmailRetry] Email queued:", {
      emailId,
      to: email.to,
      type: email.type,
      nextRetryAt,
    });

    return emailId;
  } catch (error) {
    console.error("[EmailRetry] Failed to queue email:", error);
    throw error;
  }
}

/**
 * Processar fila de emails pendentes
 */
export async function processEmailQueue(config: EmailRetryConfig = DEFAULT_CONFIG): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailRetry] Database not available");
    return;
  }

  try {
    // Buscar emails que precisam ser reenviados
    const now = new Date();
    const pendingEmails = await db
      .select()
      .from(emailQueue)
      .where(
        and(
          ne(emailQueue.status, "SENT"),
          lt(emailQueue.nextRetryAt, now)
        )
      )
      .limit(10); // Processar até 10 emails por vez

    console.log("[EmailRetry] Processing queue:", {
      count: pendingEmails.length,
      timestamp: now.toISOString(),
    });

    for (const email of pendingEmails) {
      await processEmailRetry(email, config);
    }
  } catch (error) {
    console.error("[EmailRetry] Error processing queue:", error);
  }
}

/**
 * Processar retry de um email específico
 */
async function processEmailRetry(email: EmailQueue, config: EmailRetryConfig = DEFAULT_CONFIG): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailRetry] Database not available");
    return;
  }

  try {
    console.log("[EmailRetry] Processing email:", {
      emailId: email.id,
      to: email.to,
      attempts: email.attempts,
      maxAttempts: email.maxAttempts,
    });

    // Tentar enviar email
    try {
      const sent = await sendEmail({
        to: email.to,
        subject: email.subject,
        html: email.htmlContent,
      });

      if (!sent) {
        throw new Error("Failed to send email via Resend API");
      }

      // Marcar como enviado
      await db
        .update(emailQueue)
        .set({
          status: "SENT",
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailQueue.id, email.id));

      console.log("[EmailRetry] Email sent successfully:", {
        emailId: email.id,
        to: email.to,
        attempts: email.attempts + 1,
      });
    } catch (sendError) {
      const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
      const nextAttempt = email.attempts + 1;

      if (nextAttempt >= email.maxAttempts) {
        // Marcar como falho após exceder tentativas
        await db
          .update(emailQueue)
          .set({
            status: "FAILED",
            attempts: nextAttempt,
            lastError: errorMessage,
            updatedAt: new Date(),
          })
          .where(eq(emailQueue.id, email.id));

        console.error("[EmailRetry] Email failed after max attempts:", {
          emailId: email.id,
          to: email.to,
          attempts: nextAttempt,
          maxAttempts: email.maxAttempts,
          error: errorMessage,
        });
      } else {
        // Agendar próxima tentativa
        const nextRetryDelay = calculateNextRetryDelay(nextAttempt, config);
        const nextRetryAt = new Date(Date.now() + nextRetryDelay);

        await db
          .update(emailQueue)
          .set({
            attempts: nextAttempt,
            nextRetryAt,
            lastError: errorMessage,
            updatedAt: new Date(),
          })
          .where(eq(emailQueue.id, email.id));

        console.log("[EmailRetry] Email retry scheduled:", {
          emailId: email.id,
          to: email.to,
          attempts: nextAttempt,
          nextRetryAt,
          delayMs: nextRetryDelay,
          error: errorMessage,
        });
      }
    }
  } catch (error) {
    console.error("[EmailRetry] Error processing email retry:", {
      emailId: email.id,
      error,
    });
  }
}

/**
 * Obter status de um email na fila
 */
export async function getEmailStatus(emailId: string): Promise<EmailQueue | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const result = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.id, emailId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[EmailRetry] Error getting email status:", error);
    return null;
  }
}

/**
 * Obter estatísticas da fila
 */
export async function getEmailQueueStats(): Promise<{
  pending: number;
  sent: number;
  failed: number;
  total: number;
  oldestPending: Date | null;
}> {
  const db = await getDb();
  if (!db) {
    return {
      pending: 0,
      sent: 0,
      failed: 0,
      total: 0,
      oldestPending: null,
    };
  }

  try {
    const allEmails = await db.select().from(emailQueue);

    const pending = allEmails.filter(e => e.status === "PENDING").length;
    const sent = allEmails.filter(e => e.status === "SENT").length;
    const failed = allEmails.filter(e => e.status === "FAILED").length;
    const total = allEmails.length;

    const pendingEmails = allEmails.filter(e => e.status === "PENDING");
    const oldestPending = pendingEmails.length > 0
      ? new Date(Math.min(...pendingEmails.map(e => e.createdAt.getTime())))
      : null;

    return {
      pending,
      sent,
      failed,
      total,
      oldestPending,
    };
  } catch (error) {
    console.error("[EmailRetry] Error getting queue stats:", error);
    return {
      pending: 0,
      sent: 0,
      failed: 0,
      total: 0,
      oldestPending: null,
    };
  }
}

/**
 * Iniciar worker de processamento de fila
 * Processa emails a cada intervalo especificado
 */
export function startEmailQueueWorker(intervalMs: number = 30000): ReturnType<typeof setInterval> {
  console.log("[EmailRetry] Starting email queue worker with interval:", intervalMs);

  // Processar imediatamente na inicialização
  processEmailQueue().catch(console.error);

  // Processar periodicamente
  return setInterval(() => {
    processEmailQueue().catch(console.error);
  }, intervalMs);
}

/**
 * Parar worker de processamento de fila
 */
export function stopEmailQueueWorker(timer: ReturnType<typeof setInterval>): void {
  clearInterval(timer);
  console.log("[EmailRetry] Email queue worker stopped");
}
