/**
 * Fluxuz Integration Module
 * Envia dados de música para Fluxuz disparar WhatsApp
 */

import { ENV } from "./_core/env";

export interface FluxuzPushPayload {
  name: string; // Nome do usuário
  whatsapp: string; // WhatsApp do usuário
  musicTitle: string; // Título da música
  audioUrl: string; // URL do áudio (direto)
  musicUrl: string; // URL completa para ouvir (frontend)
  shareSlug: string; // Slug para compartilhar
  lyrics: string; // Letra da música
  imageUrl?: string; // Imagem da música
  jobId: string; // ID do job
}

/**
 * Envia dados para Fluxuz disparar WhatsApp via API externa
 */
export async function sendToFluxuz(payload: FluxuzPushPayload): Promise<boolean> {
  const FLUXUZ_API_URL = process.env.FLUXUZ_API_URL;
  const FLUXUZ_API_TOKEN = process.env.FLUXUZ_API_TOKEN;

  if (!FLUXUZ_API_URL || !FLUXUZ_API_TOKEN) {
    console.error("[Fluxuz] FLUXUZ_API_URL or FLUXUZ_API_TOKEN not configured");
    return false;
  }

  try {
    const body = {
      body: `🎵 Sua música personalizada "${payload.musicTitle}" está pronta! Clique no link abaixo para ouvir:`,
      number: payload.whatsapp,
      externalKey: `job_${payload.jobId}`,
      note: {
        body: `Lead: ${payload.name} - Música: ${payload.musicTitle}`,
        mediaUrl: payload.audioUrl
      }
    };

    console.log("[Fluxuz] Sending to WhatsApp:", {
      number: payload.whatsapp,
      title: payload.musicTitle,
      audioUrl: payload.audioUrl
    });

    const response = await fetch(FLUXUZ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FLUXUZ_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log("[Fluxuz] Response:", result);

    return response.ok;
  } catch (error) {
    console.error("[Fluxuz] Error sending message:", error);
    return false;
  }
}

/**
 * Cria payload estruturado para Fluxuz
 */
export function createFluxuzPayload(
  jobId: string,
  name: string,
  whatsapp: string,
  musicTitle: string,
  audioUrl: string,
  shareSlug: string,
  lyrics: string,
  imageUrl?: string
): FluxuzPushPayload {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const musicUrl = `${appUrl}/m/${shareSlug}`;
  
  return {
    name,
    whatsapp,
    musicTitle,
    audioUrl,
    musicUrl,
    shareSlug,
    lyrics: lyrics.substring(0, 500), // Limitar tamanho
    imageUrl,
    jobId,
  };
}

/**
 * Endpoint para Fluxuz confirmar recebimento
 */
export async function handleFluxuzConfirmation(req: any, res: any) {
  try {
    const { task_id, status, message } = req.body;

    console.log("[Fluxuz Confirmation]", {
      task_id,
      status,
      message,
    });

    res.json({
      success: true,
      message: "Confirmation received",
    });
  } catch (error) {
    console.error("[Fluxuz Confirmation] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process confirmation",
    });
  }
}
