/**
 * Fluxuz Integration Module
 * Envia dados de música para Fluxuz disparar WhatsApp
 */

import { ENV } from "./_core/env";

export interface FluxuzPushPayload {
  msg: string; // Status message
  data: {
    callbackType: "text" | "first" | "complete" | "error";
    task_id: string; // jobId
    data: {
      name: string; // Nome do usuário
      whatsapp: string; // WhatsApp do usuário
      musicTitle: string; // Título da música
      audioUrl: string; // URL do áudio
      shareSlug: string; // Slug para compartilhar
      lyrics: string; // Letra da música
      imageUrl?: string; // Imagem da música
    };
  };
}

/**
 * Envia dados para Fluxuz disparar WhatsApp
 */
export async function sendToFluxuz(payload: FluxuzPushPayload): Promise<boolean> {
  try {
    const fluxuzApiUrl = process.env.FLUXUZ_API_URL || "https://api.fluxuz.com.br/webhook";
    const fluxuzApiKey = process.env.FLUXUZ_API_KEY;

    if (!fluxuzApiKey) {
      console.warn("[Fluxuz] FLUXUZ_API_KEY not configured");
      return false;
    }

    console.log("[Fluxuz] Sending to:", fluxuzApiUrl);
    console.log("[Fluxuz] Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(fluxuzApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${fluxuzApiKey}`,
      },
      body: JSON.stringify(payload),
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
  return {
    msg: `Música gerada com sucesso para ${name}`,
    data: {
      callbackType: "complete",
      task_id: jobId,
      data: {
        name,
        whatsapp,
        musicTitle,
        audioUrl,
        shareSlug,
        lyrics,
        imageUrl,
      },
    },
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
