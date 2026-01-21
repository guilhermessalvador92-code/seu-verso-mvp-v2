import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createJob, getJobById, updateJobStatus, updateJobSunoTaskId, createSong, getSongsByJobId, getSongBySlug, createLead, incrementDownloadCount } from "./db";
import { CreateJobPayload, JobStatusResponse, CallbackPayload, MUSIC_STYLES, MOODS } from "@shared/types";
import { generateMusicWithSuno } from "./suno";
import { queueOrderConfirmationEmail } from "./email-queue-integration";
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
          title: z.string().min(1, "Título da música é obrigatório"),
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
            names: input.title, // Using title as the main identifier
            occasion: input.occasion,
            story: input.story,
            mood: input.mood,
            createdAt: new Date(),
          });

          // Enfileirar email de confirmação com retry
          if (lead) {
            queueOrderConfirmationEmail(input.email, jobId, input.title).catch(error => {
              console.error("[Jobs] Failed to queue confirmation email:", error);
            });
          }

          // Iniciar geração de música
          await updateJobStatus(jobId, "PROCESSING");
          const appUrl = process.env.APP_URL || "http://localhost:3000";
          const callbackUrl = `${appUrl}/api/webhook/suno`;

          const sunoTaskId = await generateMusicWithSuno(
            jobId,
            input.story,
            input.style,
            input.title,
            input.occasion,
            input.mood,
            callbackUrl
          );

          if (sunoTaskId) {
            console.log("[Jobs] Suno task created:", sunoTaskId);
            // Salvar sunoTaskId no banco para correlação com callback
            await updateJobSunoTaskId(jobId, sunoTaskId);
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

        console.log("[Router] getStatus called:", {
          jobId: input.jobId,
          jobStatus: job.status,
        });

        if (job.status === "DONE") {
          const songs = await getSongsByJobId(input.jobId);
          console.log("[Router] Songs lookup result:", {
            songsCount: songs.length,
            titles: songs.map(s => s.title),
          });

          if (songs.length > 0) {
            return {
              status: "DONE",
              songs: songs.map(song => ({
                shareSlug: song.shareSlug || "",
                audioUrl: song.audioUrl || "",
                lyrics: song.lyrics || "",
                title: song.title || "",
                duration: song.duration || 0,
                id: song.id,
              })),
              // Keep first song as main song for compatibility
              song: {
                shareSlug: songs[0].shareSlug || "",
                audioUrl: songs[0].audioUrl || "",
                lyrics: songs[0].lyrics || "",
                title: songs[0].title || "",
              },
            };
          }
        }

        return {
          status: job.status,
        };
      }),

    forceCheck: publicProcedure
      .input(z.object({ jobId: z.string() }))
      .mutation(async ({ input }) => {
        const job = await getJobById(input.jobId);
        if (!job) {
          throw new Error("Job não encontrado");
        }

        console.log("[ForceCheck] Forcing check for job:", input.jobId);

        if (job.status === "PROCESSING" && job.sunoTaskId) {
          // Importar e usar a função de polling diretamente
          const { getSunoTaskDetails } = await import("./suno");
          
          try {
            const taskDetails = await getSunoTaskDetails(job.sunoTaskId);
            
            if (taskDetails?.data?.status === "complete" || taskDetails?.data?.status === "success") {
              const audioUrl = taskDetails.data?.audioUrl || taskDetails.data?.audioUrls?.[0];
              const lyrics = taskDetails.data?.lyrics || "";
              const title = taskDetails.data?.title || `Música ${input.jobId}`;

              if (audioUrl) {
                const shareSlug = nanoid(8);

                // Criar música
                await createSong({
                  id: nanoid(),
                  jobId: input.jobId,
                  title,
                  lyrics,
                  audioUrl,
                  shareSlug,
                  createdAt: new Date(),
                });

                // Atualizar status
                await updateJobStatus(input.jobId, "DONE");

                console.log("[ForceCheck] Job manually completed:", input.jobId);
                return { success: true, status: "DONE", message: "Música encontrada e atualizada!" };
              }
            } else if (taskDetails?.data?.status === "failed" || taskDetails?.data?.status === "error") {
              await updateJobStatus(input.jobId, "FAILED");
              return { success: false, status: "FAILED", message: "Música falhou na geração" };
            } else {
              return { success: true, status: job.status, message: `Status atual: ${taskDetails?.data?.status || "checking"}` };
            }
          } catch (error) {
            console.error("[ForceCheck] Error checking Suno:", error);
            return { success: false, message: "Erro ao verificar Suno API" };
          }
        }

        return { success: true, status: job.status, message: "Nada para verificar" };
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
