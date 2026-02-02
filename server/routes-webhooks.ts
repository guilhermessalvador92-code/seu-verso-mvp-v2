/**
 * Webhooks Routes
 * Handles callbacks from external services (Suno API)
 */

import { Router } from "express";
import { musicTaskRegistry } from "./routes-music";

const router = Router();

// Idempotency: track processed task IDs
const processedTasks = new Set<string>();

// Cleanup processed tasks after 24 hours
setInterval(() => {
  processedTasks.clear();
}, 24 * 60 * 60 * 1000);

/**
 * POST /api/webhooks/suno
 * Webhook callback from Suno API
 * MUST respond 200 immediately, then process asynchronously
 */
router.post("/suno", async (req, res) => {
  // RESPOND 200 IMMEDIATELY
  res.status(200).json({ received: true });

  // Process asynchronously
  setImmediate(async () => {
    try {
      const { code, callbackType, task_id, audio_url, video_url } = req.body;

      console.log("[Webhook] Suno callback received", {
        code,
        callbackType,
        task_id,
        hasAudio: !!audio_url,
        hasVideo: !!video_url,
      });

      // Validate required fields
      if (!task_id) {
        console.error("[Webhook] Missing task_id");
        return;
      }

      // Idempotency check
      if (processedTasks.has(task_id)) {
        console.log("[Webhook] Task already processed (idempotency)", { task_id });
        return;
      }

      // Only process "complete" callbacks with success code
      if (code !== 200 || callbackType !== "complete") {
        console.log("[Webhook] Skipping non-complete callback", {
          code,
          callbackType,
          task_id,
        });
        return;
      }

      if (!audio_url) {
        console.error("[Webhook] Missing audio_url in complete callback", { task_id });
        return;
      }

      // Get client info from registry
      const task = musicTaskRegistry.get(task_id);
      if (!task) {
        console.error("[Webhook] Task not found in registry", { task_id });
        return;
      }

      // Mark as processed (idempotency)
      processedTasks.add(task_id);

      console.log("[Webhook] Sending WhatsApp via Fluxuz...", {
        task_id,
        client: task.name,
        whatsapp: task.whatsapp,
      });

      // Send WhatsApp via Fluxuz
      const fluxuzResult = await sendWhatsAppViaFluxuz(
        task.name,
        task.whatsapp,
        audio_url,
        video_url
      );

      if (fluxuzResult.success) {
        console.log("[Webhook] ✅ WhatsApp sent successfully", {
          task_id,
          client: task.name,
        });
      } else {
        console.error("[Webhook] ❌ Failed to send WhatsApp", {
          task_id,
          error: fluxuzResult.error,
        });
      }

      // Cleanup task from registry
      musicTaskRegistry.delete(task_id);
    } catch (error: any) {
      console.error("[Webhook] Processing error:", error);
    }
  });
});

/**
 * Send WhatsApp message via Fluxuz Push API
 */
async function sendWhatsAppViaFluxuz(
  name: string,
  whatsapp: string,
  audioUrl: string,
  videoUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const FLUXUZ_PUSH_URL = process.env.FLUXUZ_PUSH_URL;
    const FLUXUZ_API_TOKEN = process.env.FLUXUZ_API_TOKEN;

    if (!FLUXUZ_PUSH_URL || !FLUXUZ_API_TOKEN) {
      console.error("[Fluxuz] Missing FLUXUZ_PUSH_URL or FLUXUZ_API_TOKEN");
      return {
        success: false,
        error: "Fluxuz credentials not configured",
      };
    }

    const message = `🎵 Olá ${name}!\n\nSua música personalizada está pronta! 🎉\n\nOuça agora: ${audioUrl}${videoUrl ? `\n\nVídeo: ${videoUrl}` : ""}\n\nObrigado por usar Seu Verso! ❤️`;

    const response = await fetch(FLUXUZ_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FLUXUZ_API_TOKEN}`,
      },
      body: JSON.stringify({
        phone: whatsapp,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Fluxuz] API error", {
        status: response.status,
        error,
      });
      return {
        success: false,
        error: `Fluxuz API error: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log("[Fluxuz] Response", result);

    return { success: true };
  } catch (error: any) {
    console.error("[Fluxuz] Send error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default router;
