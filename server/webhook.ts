/**
 * Webhook handler para receber callbacks da Suno API
 * Quando uma música é gerada, a Suno API faz POST para este endpoint
 */

import { Request, Response } from "express";
import { getJobById, updateJobStatus, createSong, getSongByJobId } from "./db";
import { sendMusicReadyEmail } from "./email";
import { nanoid } from "nanoid";

export interface SunoCallbackPayload {
  jobId: string;
  title: string;
  lyrics: string;
  audioUrl: string;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number;
  tags?: string;
  prompt?: string;
  style?: string;
}

/**
 * Validar payload do callback
 */
function validateCallbackPayload(data: any): data is SunoCallbackPayload {
  return (
    typeof data.jobId === "string" &&
    typeof data.title === "string" &&
    typeof data.lyrics === "string" &&
    typeof data.audioUrl === "string"
  );
}

/**
 * Handler para webhook de callback da Suno API
 */
export async function handleSunoCallback(req: Request, res: Response) {
  try {
    console.log("[Webhook] Received Suno callback:", {
      timestamp: new Date().toISOString(),
      body: req.body,
    });

    // Validar payload
    if (!validateCallbackPayload(req.body)) {
      console.error("[Webhook] Invalid payload:", req.body);
      return res.status(400).json({
        success: false,
        error: "Invalid payload: missing required fields (jobId, title, lyrics, audioUrl)",
      });
    }

    const { jobId, title, lyrics, audioUrl, imageUrl, videoUrl, duration, tags, prompt, style } = req.body;

    // Verificar se job existe
    const job = await getJobById(jobId);
    if (!job) {
      console.error("[Webhook] Job not found:", jobId);
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    console.log("[Webhook] Processing job:", jobId);

    // Criar registro de música
    const shareSlug = nanoid(8);
    const song = await createSong({
      id: nanoid(),
      jobId,
      title,
      lyrics,
      audioUrl,
      shareSlug,
      createdAt: new Date(),
    });

    console.log("[Webhook] Song created:", {
      songId: song?.id,
      shareSlug,
      title,
    });

    // Atualizar status do job para DONE
    await updateJobStatus(jobId, "DONE");

    console.log("[Webhook] Job status updated to DONE");

    // Buscar lead para enviar email
    try {
      const savedSong = await getSongByJobId(jobId);
      if (savedSong) {
        // Buscar email do lead (será necessário adicionar função no db.ts)
        // Por enquanto, vamos enviar email genérico
        console.log("[Webhook] Song saved, ready for email notification");
      }
    } catch (error) {
      console.error("[Webhook] Error retrieving saved song:", error);
    }

    // Responder com sucesso
    return res.status(200).json({
      success: true,
      message: "Callback processed successfully",
      data: {
        jobId,
        songId: song?.id,
        shareSlug,
        shareUrl: `${process.env.APP_URL || "http://localhost:3000"}/m/${shareSlug}`,
      },
    });
  } catch (error) {
    console.error("[Webhook] Error processing callback:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Health check para webhook
 */
export function handleWebhookHealth(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: "Webhook is running",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Endpoint para testar webhook (POST com dados simulados)
 */
export async function handleWebhookTest(req: Request, res: Response) {
  try {
    console.log("[Webhook] Test request received");

    // Dados de teste
    const testPayload: SunoCallbackPayload = {
      jobId: "test-job-" + Date.now(),
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

    console.log("[Webhook] Processing test payload:", testPayload);

    // Tentar processar como se fosse um callback real
    const result = await handleSunoCallback(
      { body: testPayload } as Request,
      res
    );

    return result;
  } catch (error) {
    console.error("[Webhook] Error in test:", error);
    return res.status(500).json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
