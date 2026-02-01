/**
 * Webhook handler para receber callbacks da Suno API
 * Salva dados no banco (nome + whatsapp)
 * Fluxuz (empresa de mensageria) trata o envio de WhatsApp
 */

import { Request, Response } from "express";
import { getJobById, updateJobStatus, createSong, getLeadByJobId } from "./db";
import { nanoid } from "nanoid";
import { sendToFluxuz, createFluxuzPayload } from "./fluxuz";

export interface SunoMusicData {
  id: string;
  audio_url: string;
  image_url?: string;
  title: string;
  prompt?: string;
  tags?: string;
  duration?: number;
}

/**
 * Handle Suno API callback
 * Called when music generation is complete
 * Salva música no banco com dados do lead (nome + whatsapp)
 */
export async function handleSunoCallback(req: Request, res: Response) {
  try {
    const { code, msg, data } = req.body;

    // Validate payload
    if (!data || typeof data !== "object") {
      console.error("[Webhook] Invalid payload structure");
      return res.status(200).json({
        success: false,
        error: "Invalid payload structure",
      });
    }

    const { callbackType, task_id, data: musicData } = data;

    console.log("[Webhook] Received callback:", {
      callbackType,
      task_id,
      code,
      musicDataCount: Array.isArray(musicData) ? musicData.length : 0,
    });

    // Handle errors from Suno
    if (code !== 200 || callbackType === "error") {
      console.error("[Webhook] Suno API error:", { code, msg, callbackType });
      
      try {
        await updateJobStatus(task_id, "FAILED");
        console.log("[Webhook] Job marked as FAILED:", task_id);
      } catch (error) {
        console.error("[Webhook] Failed to update job status:", error);
      }

      return res.status(200).json({
        success: false,
        error: msg || "Generation failed",
      });
    }

    // Handle completion
    if (callbackType === "complete" && Array.isArray(musicData) && musicData.length > 0) {
      try {
        const jobId = task_id;
        const job = await getJobById(jobId);

        if (!job) {
          console.error("[Webhook] Job not found:", jobId);
          return res.status(200).json({
            success: false,
            error: "Job not found",
          });
        }

        // Get lead info (nome + whatsapp)
        const lead = await getLeadByJobId(jobId);

        // Process first music track
        const music = musicData[0];
        const audioUrl = music.audio_url;
        const title = music.title || `Música ${jobId}`;
        const lyrics = music.prompt || "";
        const shareSlug = nanoid(8);

        console.log("[Webhook] Creating song:", { 
          jobId, 
          title, 
          audioUrl,
          leadName: lead?.name,
          leadWhatsapp: lead?.whatsapp,
        });

        // Create song record
        await createSong({
          id: nanoid(),
          jobId,
          title,
          lyrics,
          audioUrl,
          imageUrl: music.image_url,
          duration: Math.round(music.duration || 0),
          tags: music.tags,
          modelName: "suno-v3",
          shareSlug,
          createdAt: new Date(),
        });

        // Update job status
        await updateJobStatus(jobId, "DONE");
        console.log("[Webhook] Job marked as DONE:", jobId);

        // Send to Fluxuz for WhatsApp dispatch
        if (lead) {
          console.log("[Webhook] Sending to Fluxuz...");
          const fluxuzPayload = createFluxuzPayload(
            jobId,
            lead.name,
            lead.whatsapp,
            title,
            audioUrl,
            shareSlug,
            lyrics,
            music.image_url
          );
          
          const fluxuzSent = await sendToFluxuz(fluxuzPayload);
          console.log("[Webhook] Fluxuz sent:", fluxuzSent);
        } else {
          console.warn("[Webhook] No lead found for Fluxuz integration");
        }

        return res.status(200).json({
          success: true,
          message: "Music processed successfully",
          leadInfo: lead ? {
            name: lead.name,
            whatsapp: lead.whatsapp,
          } : null,
        });
      } catch (error: any) {
        console.error("[Webhook] Error processing music:", error);
        
        try {
          await updateJobStatus(task_id, "FAILED");
        } catch (updateError) {
          console.error("[Webhook] Failed to mark job as failed:", updateError);
        }

        return res.status(200).json({
          success: false,
          error: "Failed to process music",
        });
      }
    }

    // Handle intermediate callbacks (first, text)
    if (callbackType === "first" || callbackType === "text") {
      console.log("[Webhook] Intermediate callback:", callbackType);
      return res.status(200).json({
        success: true,
        message: "Callback received",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Callback processed",
    });
  } catch (error) {
    console.error("[Webhook] Unexpected error:", error);
    return res.status(200).json({
      success: false,
      error: "Unexpected error",
    });
  }
}

/**
 * Health check endpoint
 */
export function webhookHealthCheck(req: Request, res: Response) {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
}

/**
 * Test endpoint for webhook
 */
export async function webhookTest(req: Request, res: Response) {
  try {
    const testJobId = nanoid();
    
    console.log("[Webhook Test] Creating test job:", testJobId);
    
    // Simulate a successful callback
    const testPayload = {
      code: 200,
      msg: "Test successful",
      data: {
        callbackType: "complete",
        task_id: testJobId,
        data: [
          {
            id: nanoid(),
            audio_url: "https://example.com/test-audio.mp3",
            image_url: "https://example.com/test-image.jpg",
            title: "Test Music",
            prompt: "Test prompt",
            tags: "test",
            duration: 180,
          },
        ],
      },
    };

    // Process test payload
    await handleSunoCallback(
      { body: testPayload } as Request,
      res
    );
  } catch (error) {
    console.error("[Webhook Test] Error:", error);
    res.status(500).json({ success: false, error: "Test failed" });
  }
}
