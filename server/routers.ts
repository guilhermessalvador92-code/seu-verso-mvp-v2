import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createJob, getJobById, updateJobStatus, createSong, getSongByJobId, getSongBySlug, createLead, incrementDownloadCount } from "./db";
import { CreateJobPayload, JobStatusResponse, CallbackPayload, MUSIC_STYLES, MOODS } from "@shared/types";
import { generateMusicWithSuno } from "./suno";
import { sendOrderConfirmationEmail } from "./email";
import { addJobToPolling } from "./suno-polling";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  jobs: router({
    create: publicProcedure
      .input(
        z.object({
          story: z.string().min(10, "História deve ter pelo menos 10 caracteres"),
          style: z.enum(MUSIC_STYLES as unknown as [string, ...string[]]),
          names: z.string().min(1, "Nome(s) do(s) homenageado(s) é obrigatório"),
          occasion: z.string().optional(),
          mood: z.enum(MOODS as unknown as [string, ...string[]]).optional(),
          email: z.string().email("Email inválido"),
          agreedToTerms: z.boolean().refine(v => v === true, "Você deve concordar com os termos"),
        })
      )
      .mutation(async ({ input }) => {
        const jobId = nanoid();
        const shareSlug = nanoid(8);

        try {
          await createJob({
            id: jobId,
            status: "QUEUED",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const lead = await createLead({
            id: nanoid(),
            jobId,
            email: input.email,
            style: input.style,
            names: input.names,
            occasion: input.occasion,
            story: input.story,
            mood: input.mood,
            createdAt: new Date(),
          });

          // Enviar email de confirmação
          if (lead) {
            sendOrderConfirmationEmail(input.email, jobId, input.names).catch(error => {
              console.error("[Jobs] Failed to send confirmation email:", error);
            });
          }

          // Iniciar geração de música
          await updateJobStatus(jobId, "PROCESSING");
          const appUrl = process.env.APP_URL || "http://localhost:3000";
          const callbackUrl = `${appUrl}/api/callback/job-done`;

          const sunoTaskId = await generateMusicWithSuno(
            jobId,
            input.story,
            input.style,
            input.names,
            input.occasion,
            input.mood,
            callbackUrl
          );

          if (sunoTaskId) {
            console.log("[Jobs] Suno task created:", sunoTaskId);
            // Adicionar à fila de polling
            addJobToPolling(jobId, sunoTaskId);
          } else {
            console.log("[Jobs] Suno generation failed");
            await updateJobStatus(jobId, "FAILED");
          }

          return {
            jobId,
            statusUrl: `/status/${jobId}`,
          };
        } catch (error) {
          console.error("[Jobs] Create failed:", error);
          await updateJobStatus(jobId, "FAILED");
          throw error;
        }
      }),

    getStatus: publicProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }): Promise<JobStatusResponse> => {
        const job = await getJobById(input.jobId);
        if (!job) {
          throw new Error("Job não encontrado");
        }

        if (job.status === "DONE") {
          const song = await getSongByJobId(input.jobId);
          if (song) {
            return {
              status: "DONE",
              song: {
                shareSlug: song.shareSlug || "",
                audioUrl: song.audioUrl || "",
                lyrics: song.lyrics || "",
                title: song.title || "",
              },
            };
          }
        }

        return {
          status: job.status,
        };
      }),

    getSongBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const song = await getSongBySlug(input.slug);
        if (!song) {
          throw new Error("Música não encontrada");
        }
        return song;
      }),

    callback: publicProcedure
      .input(
        z.object({
          jobId: z.string(),
          title: z.string(),
          lyrics: z.string(),
          audioUrl: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const job = await getJobById(input.jobId);
        if (!job) {
          throw new Error("Job não encontrado");
        }

        const shareSlug = nanoid(8);
        await createSong({
          id: nanoid(),
          jobId: input.jobId,
          title: input.title,
          lyrics: input.lyrics,
          audioUrl: input.audioUrl,
          shareSlug,
          createdAt: new Date(),
        });

        await updateJobStatus(input.jobId, "DONE");

        return { success: true };
      }),
  }),

  music: router({
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const song = await getSongBySlug(input.slug);
        if (!song) {
          throw new Error("Música não encontrada");
        }
        return song;
      }),

    recordDownload: publicProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ input }) => {
        await incrementDownloadCount(input.slug);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
