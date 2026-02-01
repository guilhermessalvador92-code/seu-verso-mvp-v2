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
  try {
    // API Externa Fluxuz (com token na URL)
    const fluxuzApiUrl = process.env.FLUXUZ_API_URL;
    
    if (!fluxuzApiUrl) {
      console.error("[Fluxuz] FLUXUZ_API_URL not configured");
      return false;
    }

    // Formato correto da API Fluxuz (conforme documentação e teste Postman)
    const apiPayload = {
      message: `Olá ${payload.name}! 🎵\n\nSua música "${payload.musicTitle}" está pronta!\n\nOuça agora: ${payload.musicUrl}\n\n🎧 Link direto: ${payload.audioUrl}`,
      number: payload.whatsapp,
      externalKey: payload.jobId, // Para rastreamento
    };

    console.log("[Fluxuz] Sending to:", fluxuzApiUrl);
    console.log("[Fluxuz] Payload:", JSON.stringify(apiPayload, null, 2));

    const response = await fetch(fluxuzApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Fluxuz] Error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return false;
    }

    const result = await response.json();
    console.log("[Fluxuz] Success response:", result);
    return true;
  } catch (error) {
    console.error("[Fluxuz] Failed to send:", error);
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
