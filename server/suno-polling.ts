import { getSunoTaskDetails } from "./suno";
import { updateJobStatus, updateSongAudioUrl, createSong, getLeadByJobId, markEmailSent } from "./db";
import { nanoid } from "nanoid";
import { sendMusicReadyEmail } from "./email";

interface PollingJob {
  jobId: string;
  sunoTaskId: string;
  retries: number;
  lastCheck: number;
}

const POLLING_JOBS: Map<string, PollingJob> = new Map();
const POLLING_INTERVAL = 10000; // 10 segundos
const MAX_RETRIES = 360; // 1 hora (360 * 10s)

let pollingInterval: NodeJS.Timeout | null = null;

export function addJobToPolling(jobId: string, sunoTaskId: string): void {
  POLLING_JOBS.set(jobId, {
    jobId,
    sunoTaskId,
    retries: 0,
    lastCheck: Date.now(),
  });

  if (!pollingInterval) {
    startPolling();
  }

  console.log("[Polling] Job added to polling queue", { jobId, sunoTaskId });
}

export function removeJobFromPolling(jobId: string): void {
  POLLING_JOBS.delete(jobId);
  console.log("[Polling] Job removed from polling queue", { jobId });

  if (POLLING_JOBS.size === 0 && pollingInterval) {
    stopPolling();
  }
}

function startPolling(): void {
  if (pollingInterval) return;

  console.log("[Polling] Starting polling interval");

  pollingInterval = setInterval(async () => {
    const jobs = Array.from(POLLING_JOBS.values());

    for (const job of jobs) {
      try {
        await checkJobStatus(job);
      } catch (error) {
        console.error("[Polling] Error checking job status:", error);
      }
    }
  }, POLLING_INTERVAL);
}

function stopPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log("[Polling] Stopped polling interval");
  }
}

async function checkJobStatus(job: PollingJob): Promise<void> {
  job.retries++;

  if (job.retries > MAX_RETRIES) {
    console.error("[Polling] Max retries exceeded for job", { jobId: job.jobId });
    await updateJobStatus(job.jobId, "FAILED");
    removeJobFromPolling(job.jobId);
    return;
  }

  const taskDetails = await getSunoTaskDetails(job.sunoTaskId);

  if (!taskDetails) {
    console.warn("[Polling] Failed to get task details", { jobId: job.jobId, sunoTaskId: job.sunoTaskId });
    return;
  }

  const status = taskDetails.data?.status;

  console.log("[Polling] Task status check", {
    jobId: job.jobId,
    sunoTaskId: job.sunoTaskId,
    status,
    retries: job.retries,
  });

  if (status === "complete" || status === "success") {
    // Música pronta!
    const audioUrl = taskDetails.data?.audioUrl || taskDetails.data?.audioUrls?.[0];
    const lyrics = taskDetails.data?.lyrics || "";
    const title = taskDetails.data?.title || `Música para ${job.jobId}`;

    if (audioUrl) {
      const shareSlug = nanoid(8);

      // Criar registro da música
      await createSong({
        id: nanoid(),
        jobId: job.jobId,
        title,
        lyrics,
        audioUrl,
        shareSlug,
        createdAt: new Date(),
      });

      // Atualizar status do job
      await updateJobStatus(job.jobId, "DONE");

      // Enviar email
      try {
        const lead = await getLeadByJobId(job.jobId);
        if (lead) {
          const appUrl = process.env.APP_URL || "http://localhost:3000";
          const downloadUrl = `${appUrl}/m/${shareSlug}`;
          const shareUrl = downloadUrl;

          const emailSent = await sendMusicReadyEmail(
            lead.email,
            title,
            downloadUrl,
            shareUrl,
            lead.names
          );

          if (emailSent) {
            await markEmailSent(job.jobId);
          }
        }
      } catch (error) {
        console.error("[Polling] Error sending email:", error);
      }

      console.log("[Polling] Job completed successfully", { jobId: job.jobId });
      removeJobFromPolling(job.jobId);
    } else {
      console.error("[Polling] No audio URL in task details", { jobId: job.jobId });
      await updateJobStatus(job.jobId, "FAILED");
      removeJobFromPolling(job.jobId);
    }
  } else if (status === "error" || status === "fail") {
    console.error("[Polling] Task failed", {
      jobId: job.jobId,
      error: taskDetails.data?.error,
    });
    await updateJobStatus(job.jobId, "FAILED");
    removeJobFromPolling(job.jobId);
  }
  // else: continue polling
}

// Recuperar jobs pendentes ao iniciar o servidor
export async function recoverPendingJobs(): Promise<void> {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();

    if (!db) {
      console.warn("[Polling] Database not available for recovery");
      return;
    }

    const { jobs } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const pendingJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, "PROCESSING"));

    for (const job of pendingJobs) {
      if (job.sunoTaskId) {
        addJobToPolling(job.id, job.sunoTaskId);
        console.log("[Polling] Recovered pending job", { jobId: job.id, sunoTaskId: job.sunoTaskId });
      }
    }
  } catch (error) {
    console.error("[Polling] Error recovering pending jobs:", error);
  }
}
