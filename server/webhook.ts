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
import { getSunoTaskDetails } from "./suno";

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
  lyrics?: string;  // Lyrics pode vir no callback
  gpt_description_prompt?: string;
  createTime: string;
  duration: number;
}

/**
 * Melhorar e formatar lyrics para exibição
 * Tenta extrair lyrics de múltiplas fontes
 */
function extractAndFormatLyrics(
  lyrics?: string,
  gptDescription?: string,
  prompt?: string
): string {
  // Preferência: lyrics completas > descrição GPT > prompt
  let content = lyrics || gptDescription || prompt || "";
  
  // Se for vazio, retornar fallback
  if (!content) {
    return "Música gerada via Suno API";
  }
  
  // Se for o prompt bruto, tentar extrair seções de letra
  if (!lyrics && !gptDescription && prompt) {
    // Procurar por padrões de verso/chorus no prompt
    const verseMatch = prompt.match(/\[Verse.*?\](.*?)(?:\[|$)/si);
    const chorusMatch = prompt.match(/\[Chorus.*?\](.*?)(?:\[|$)/si);
    
    if (verseMatch || chorusMatch) {
      let formatted = "";
      if (verseMatch) formatted += `[Verso]\n${verseMatch[1].trim()}\n\n`;
      if (chorusMatch) formatted += `[Refrão]\n${chorusMatch[1].trim()}`;
      if (formatted) return formatted;
    }
  }
  
  // Limpar e formatar o conteúdo
  content = content
    .replace(/\[IMPORTANT:.*?\]/gi, "")
    .replace(/^https?:\/\/.+$/gm, "")
    .trim();
  
  return content || "Música gerada via Suno API";
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
          console.error("[Webhook] Job not found:", jobId);
          return res.status(404).json({
            success: false,
            error: "Job not found",
          });
        }

        // Create song with a public share slug
        const shareSlug = nanoid(8);
        const songData = {
          id: nanoid(),
          jobId,
          title: title || "Untitled",
          lyrics: lyrics || "",
          audioUrl,
          shareSlug,
          createdAt: new Date(),
        };

        console.log("[Webhook Test] Creating song with data:", songData);
        const song = await createSong(songData);

        console.log("[Webhook Test] Song created result:", {
          jobId,
          songId: song?.id,
          shareSlug: song?.shareSlug,
          title: song?.title,
          audioUrl: song?.audioUrl,
        });

        // Update job status
        await updateJobStatus(jobId, "DONE");

        console.log("[Webhook Test] Job status updated to DONE:", jobId);

        return res.status(200).json({
          success: true,
          data: {
            jobId,
            songId: song?.id,
            shareSlug: song?.shareSlug,
            shareUrl: `/m/${song?.shareSlug}`,
          },
        });
      } catch (error) {
        console.error("[Webhook Test] Error processing test callback:", error);
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
        lyrics,  // Capture lyrics if provided by Suno
        gpt_description_prompt,
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
        // Preferência: lyrics > gpt_description_prompt > prompt
        const songLyrics = extractAndFormatLyrics(lyrics, gpt_description_prompt, prompt);
        
        const songData = {
          id: nanoid(),
          jobId: jobId,
          title: title || "Untitled",
          lyrics: songLyrics,
          audioUrl: audio_url,
          imageUrl: image_url,
          duration: duration || 0,
          tags: tags || "",
          modelName: model_name || "chirp-v3-5",
          shareSlug,
          createdAt: new Date(),
        };

        console.log("[Webhook] Creating song with data:", {
          jobId,
          title: songData.title,
          hasLyrics: !!lyrics,
          hasDescription: !!gpt_description_prompt,
          lyricsLength: songLyrics.length,
          audioUrl: audio_url,
        });
        
        const song = await createSong(songData);

        console.log("[Webhook] Song created result:", {
          jobId: jobId,
          songId: song?.id,
          shareSlug: song?.shareSlug,
          title: song?.title,
          audioUrl: song?.audioUrl,
          lyricsLength: song?.lyrics?.length,
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
 * 
 * Uso:
 * POST /api/webhook/test
 * POST /api/webhook/test?jobId=xyz  (para correlacionar com job específico)
 */
export async function webhookTest(req: Request, res: Response) {
  const jobIdParam = typeof req.query === 'object' ? req.query.jobId as string : undefined;
  
  // Se jobId foi fornecido, simular com dados reais daquele job
  if (jobIdParam) {
    try {
      const job = await getJobById(jobIdParam);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found",
        });
      }

      console.log("[Webhook Test] Simulating callback for job:", jobIdParam);

      // Se job tem sunoTaskId, usar esse
      const sunoTaskId = job.sunoTaskId || `test-${nanoid(8)}`;

      // Simular callback com dados reais
      const mockCallback: SunoCallbackRequest = {
        code: 200,
        msg: "All generated successfully.",
        data: {
          callbackType: "complete",
          task_id: sunoTaskId,
          data: [
            {
              id: nanoid(),
              audio_url: "https://cdn1.suno.ai/6a01e748-243c-4e15-aa4d-dbe514febe88.mp3",
              image_url: "https://cdn2.suno.ai/image_6a01e748.jpeg",
              prompt: "Uma música alegre celebrando amizade e momentos especiais",
              title: `Música para Guilherme - ${new Date().toLocaleTimeString()}`,
              tags: "celebração, amizade, teste",
              model_name: "chirp-v3-5",
              duration: 180,
              createTime: new Date().toISOString(),
              // Retornar lyrics bem estruturadas
              lyrics: `[Verso 1]
Guilherme, amigo do coração
Sua amizade é uma benção
Todos os dias mais feliz
Com você nessa jornada, que emoção

[Pré-Refrão]
Você está sempre lá
Quando eu preciso contar

[Refrão]
Guilherme, você é especial demais
Sua alegria nos traz paz
Você é nosso herói, é verdade
Sempre junto em tudo que fazemos com felicidade

[Verso 2]
Momentos compartilhados, risos e magia
Sua força e teu sorriso ilumina o dia
Obrigado pelas lições que você me deu
Guilherme, você é ouro, sempre vou acreditar em você`,
              gpt_description_prompt: "Uma celebração sincera da amizade, lealdade e dos momentos especiais compartilhados"
            },
          ],
        },
      };

      // Chamar handler
      await handleSunoCallback(
        { body: mockCallback } as Request,
        res
      );
      return;
    } catch (error) {
      console.error("[Webhook Test] Error:", error);
      return res.status(500).json({
        success: false,
        error: String(error),
      });
    }
  }

  // Fallback: simular callback genérico
  const mockCallback: SunoCallbackRequest = {
    code: 200,
    msg: "All generated successfully.",
    data: {
      callbackType: "complete",
      task_id: req.body?.task_id || `test-${nanoid(8)}`,
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
