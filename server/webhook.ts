/**
 * Webhook handler para receber callbacks da Suno API
 * Quando uma música é gerada, a Suno API faz POST para este endpoint
 * 
 * Estrutura do callback:
 * {
 *   code: 200,
 *   msg: "All generated successfully.",
 *   data: {
 *     callbackType: "complete",
 *     task_id: "...",
 *     data: [
 *       {
 *         id: "...",
 *         audio_url: "https://...",
 *         image_url: "https://...",
 *         prompt: "...",
 *         title: "...",
 *         tags: "...",
 *         duration: 198.44
 *       }
 *     ]
 *   }
 * }
 */

import { Request, Response } from "express";
import { getJobById, getJobBySunoTaskId, updateJobStatus, createSong, getLeadByJobId } from "./db";
import { queueMusicReadyEmail } from "./email-queue-integration";
import { nanoid } from "nanoid";

/**
 * Estrutura do callback da Suno API
 */
export interface SunoCallbackRequest {
  code: number;
  msg: string;
  data: {
    callbackType: "complete" | "first" | "text" | "error";
    task_id: string;
    data: SunoMusicData[] | null;
  };
}

export interface SunoMusicData {
  id: string;
  audio_url: string;
  source_audio_url?: string;
  stream_audio_url?: string;
  source_stream_audio_url?: string;
  image_url: string;
  source_image_url?: string;
  prompt: string;
  model_name: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number;
}

/**
 * Validar payload do callback da Suno
 */
function validateSunoCallback(data: any): data is SunoCallbackRequest {
  return (
    typeof data.code === "number" &&
    typeof data.msg === "string" &&
    data.data &&
    typeof data.data.callbackType === "string" &&
    typeof data.data.task_id === "string"
  );
}

/**
 * Handler para webhook de callback da Suno API
 */
export async function handleSunoCallback(req: Request, res: Response) {
  try {
    console.log("[Webhook] Received Suno callback:", {
      timestamp: new Date().toISOString(),
      code: req.body?.code,
      callbackType: req.body?.data?.callbackType,
      taskId: req.body?.data?.task_id || req.body?.jobId,
    });

    // Test format: expect full payload { jobId, title, lyrics, audioUrl }
    if (req.body?.jobId && req.body?.title && req.body?.lyrics && req.body?.audioUrl) {
      const { jobId, title, lyrics, audioUrl } = req.body;

      try {
        const job = await getJobById(jobId);
        if (!job) {
          return res.status(404).json({
            success: false,
            error: "Job not found",
          });
        }

        // Create song with a public share slug
        const shareSlug = nanoid(8);
        const song = await createSong({
          id: nanoid(),
          jobId,
          title: title || "Untitled",
          lyrics: lyrics || "",
          audioUrl,
          shareSlug,
          createdAt: new Date(),
        });

        // Update job status
        await updateJobStatus(jobId, "DONE");

        return res.status(200).json({
          success: true,
          data: {
            jobId,
            songId: song?.id,
            shareSlug,
            shareUrl: `/m/${shareSlug}`,
          },
        });
      } catch (error) {
        console.error("[Webhook] Error processing test callback:", error);
        return res.status(500).json({
          success: false,
          error: String(error),
        });
      }
    }

    // Validar payload
    if (!validateSunoCallback(req.body)) {
      console.error("[Webhook] Invalid payload structure:", req.body);
      return res.status(400).json({
        success: false,
        error: "Invalid payload structure",
      });
    }

    const { code, msg, data } = req.body;
    const { callbackType, task_id, data: musicData } = data;

    // Verificar se é erro
    if (code !== 200) {
      console.error("[Webhook] Suno API error:", { code, msg, callbackType });
      
      // Atualizar job para FAILED
      try {
        await updateJobStatus(task_id, "FAILED");
        console.log("[Webhook] Job marked as FAILED:", task_id);
      } catch (error) {
        console.error("[Webhook] Failed to update job status:", error);
      }

      return res.status(200).json({
        success: false,
        error: msg,
        code,
      });
    }

    // Processar sucesso
    if (callbackType === "complete" || callbackType === "first") {
      if (!musicData || !Array.isArray(musicData) || musicData.length === 0) {
        console.error("[Webhook] No music data in callback");
        return res.status(400).json({
          success: false,
          error: "No music data provided",
        });
      }

      // Processar primeira música do array
      const firstMusic = musicData[0];
      if (!firstMusic) {
        return res.status(400).json({
          success: false,
          error: "Music data is empty",
        });
      }

      const {
        audio_url,
        image_url,
        prompt,
        title,
        tags,
        duration,
        model_name,
      } = firstMusic;

      // Validar dados obrigatórios
      if (!audio_url || !title) {
        console.error("[Webhook] Missing required fields:", {
          audio_url: !!audio_url,
          title: !!title,
        });
        return res.status(400).json({
          success: false,
          error: "Missing required fields (audio_url, title)",
        });
      }

      // Recuperar jobId pelo sunoTaskId
      const job = await getJobBySunoTaskId(task_id);
      if (!job) {
        console.error("[Webhook] No job found for Suno task_id:", task_id);
        return res.status(404).json({
          success: false,
          error: `Job not found for task_id: ${task_id}`,
        });
      }

      const jobId = job.id;

      // Gerar slug único para compartilhamento
      const shareSlug = nanoid(16);

      try {
        // Criar registro de música
        const song = await createSong({
          id: nanoid(),
          jobId: jobId,
          title: title || "Untitled",
          lyrics: prompt || "",
          audioUrl: audio_url,
          imageUrl: image_url,
          duration: duration || 0,
          tags: tags || "",
          modelName: model_name || "chirp-v3-5",
          shareSlug,
          createdAt: new Date(),
        });

        console.log("[Webhook] Song created:", {
          jobId: jobId,
          songId: song?.id,
          shareSlug,
          title,
          duration,
        });

        // Atualizar job status para DONE
        await updateJobStatus(jobId, "DONE");
        console.log("[Webhook] Job marked as DONE:", jobId);

        // Obter lead para enviar email
        const lead = await getLeadByJobId(jobId);
        if (lead && lead.email) {
          console.log("[Webhook] Queuing music ready email for:", lead.email);
          queueMusicReadyEmail(lead.email, jobId, shareSlug, title).catch(
            (error) => {
              console.error("[Webhook] Failed to queue email:", error);
            }
          );
        }

        // Retornar sucesso
        return res.status(200).json({
          success: true,
          message: "Music processed successfully",
          data: {
            jobId: jobId,
            shareSlug,
            musicUrl: `/m/${shareSlug}`,
          },
        });
      } catch (error) {
        console.error("[Webhook] Error processing music:", error);
        
        // Tentar atualizar job para FAILED
        try {
          await updateJobStatus(task_id, "FAILED");
        } catch (updateError) {
          console.error("[Webhook] Failed to update job status:", updateError);
        }

        return res.status(500).json({
          success: false,
          error: "Failed to process music",
        });
      }
    } else if (callbackType === "text") {
      // Callback de geração de texto (apenas prompt gerado)
      console.log("[Webhook] Text generation completed for task:", task_id);
      return res.status(200).json({
        success: true,
        message: "Text generation received",
      });
    } else if (callbackType === "error") {
      // Callback de erro
      console.error("[Webhook] Error callback received:", {
        taskId: task_id,
        msg,
      });

      try {
        await updateJobStatus(task_id, "FAILED");
      } catch (error) {
        console.error("[Webhook] Failed to update job status:", error);
      }

      return res.status(200).json({
        success: false,
        error: msg,
      });
    } else {
      console.warn("[Webhook] Unknown callback type:", callbackType);
      return res.status(200).json({
        success: true,
        message: "Callback received",
      });
    }
  } catch (error) {
    console.error("[Webhook] Unexpected error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Health check endpoint para webhook
 */
export async function webhookHealthCheck(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "Webhook is running",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Test endpoint para simular callback da Suno
 */
export async function webhookTest(req: Request, res: Response) {
  // Simular callback de sucesso
  const mockCallback: SunoCallbackRequest = {
    code: 200,
    msg: "All generated successfully.",
    data: {
      callbackType: "complete",
      task_id: req.body?.task_id || "test-task-123",
      data: [
        {
          id: "music-id-123",
          audio_url: "https://example.com/music.mp3",
          image_url: "https://example.com/cover.jpg",
          prompt:
            "[Verse] This is a test music generation\n[Chorus] Testing the webhook",
          title: req.body?.title || "Test Music",
          tags: "test, webhook",
          model_name: "chirp-v3-5",
          duration: 180,
          createTime: new Date().toISOString(),
        },
      ],
    },
  };

  // Chamar handler
  await handleSunoCallback(
    { body: mockCallback } as Request,
    res
  );
}
