import { COOKIE_NAME } from "./_core/cookies";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createJob, getJobById, updateJobStatus, updateJobSunoTaskId, createSong, getSongsByJobId, getSongBySlug, createLead, incrementDownloadCount } from "./db";
import { CreateJobPayload, JobStatusResponse, CallbackPayload, MUSIC_STYLES, MOODS } from "@shared/types";
import { generateMusicWithSuno } from "./suno";

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
          voiceGender: z.enum(["Masculina", "Feminina"]).optional(),
          name: z.string().min(1, "Nome é obrigatório"),
          whatsapp: z.string().min(10, "WhatsApp inválido"),
          agreedToTerms: z.boolean().refine(v => v === true, "Você deve concordar com os termos"),
        })
      )
      .mutation(async ({ input }) => {
        const jobId = nanoid();
        const shareSlug = nanoid(8);

        try {
          // 1. Create job
          console.log("[Jobs] Creating job:", jobId);
          await createJob({
            id: jobId,
            status: "QUEUED",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // 2. Create lead (customer info) - APENAS NOME + WHATSAPP
          console.log("[Jobs] Creating lead for:", input.name, input.whatsapp);
          const lead = await createLead({
            id: nanoid(),
            jobId,
            whatsapp: input.whatsapp,
            name: input.name,
            style: input.style,
            occasion: input.occasion,
            story: input.story,
            mood: input.mood,
            createdAt: new Date(),
          });

          // 3. Update status to PROCESSING
          await updateJobStatus(jobId, "PROCESSING");
          
          // 4. Generate music with Suno
          // Gemini vai processar a história ANTES de enviar para Suno
          console.log("[Jobs] Sending to Suno API...");
          const appUrl = process.env.APP_URL || "http://localhost:3000";
          const callbackUrl = `${appUrl}/api/webhook/suno`;

          const sunoTaskId = await generateMusicWithSuno(
            jobId,
            input.story,  // História do usuário (Gemini vai processar)
            input.style,
            input.name,   // Nome para homenagear
            input.occasion,
            input.mood,
            input.language,  // Idioma da música
            callbackUrl
          );

          if (sunoTaskId) {
            console.log("[Jobs] Suno task created:", sunoTaskId);
            await updateJobSunoTaskId(jobId, sunoTaskId);
          } else {
            console.log("[Jobs] Suno generation failed");
            await updateJobStatus(jobId, "FAILED");
            throw new Error("Failed to generate music");
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
        try {
          const job = await getJobById(input.jobId);
          if (!job) {
            return { status: "FAILED" as const };
          }

          console.log("[Router] getStatus:", { jobId: input.jobId, status: job.status });

          if (job.status === "DONE") {
            const songs = await getSongsByJobId(input.jobId);
            if (songs && songs.length > 0) {
              return {
                status: "DONE" as const,
                song: {
                  shareSlug: songs[0].shareSlug || "",
                  audioUrl: songs[0].audioUrl || "",
                  lyrics: songs[0].lyrics || "",
                  title: songs[0].title || "",
                },
              };
            }
          }

          return { status: (job.status || "QUEUED") as "QUEUED" | "PROCESSING" | "DONE" | "FAILED" };
        } catch (error) {
          console.error("[Router] getStatus error:", error);
          return { status: "FAILED" as const };
        }
      }),

    getSongBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        try {
          const song = await getSongBySlug(input.slug);
          if (!song) {
            return null;
          }
          return song;
        } catch (error) {
          console.error("[Router] getSongBySlug error:", error);
          return null;
        }
      }),

    incrementDownload: publicProcedure
      .input(z.object({ songId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await incrementDownloadCount(input.songId);
          return { success: true };
        } catch (error) {
          console.error("[Router] incrementDownload error:", error);
          return { success: false };
        }
      }),
  }),
});
