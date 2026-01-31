/**
 * Webhook handler para receber callbacks da Suno API
 */

import { Request, Response } from "express";
import { getJobById, updateJobStatus, createSong, getLeadByJobId } from "./db";
import { queueMusicReadyEmail } from "./email-queue-integration";
import { nanoid } from "nanoid";

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

        // Get lead info for email
        const lead = await getLeadByJobId(jobId);

        // Process first music track
        const music = musicData[0];
        const audioUrl = music.audio_url;
        const title = music.title || `Música ${jobId}`;
        const lyrics = music.prompt || "";
        const shareSlug = nanoid(8);

        console.log("[Webhook] Creating song:", { jobId, title, audioUrl });

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

        // Queue music ready email
        if (lead) {
          queueMusicReadyEmail(lead.email, jobId, title, shareSlug).catch(error => {
            console.error("[Webhook] Failed to queue music ready email:", error);
          });
        }

        return res.status(200).json({
          success: true,
          message: "Music processed successfully",
        });
      } catch (error) {
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
