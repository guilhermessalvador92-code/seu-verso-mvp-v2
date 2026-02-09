/**
 * Webhook handler para receber callbacks da Suno API
 * Salva dados no banco (nome + whatsapp)
 * Fluxuz (empresa de mensageria) trata o envio de WhatsApp
 */

import { Request, Response } from "express";
import { getJobById, getJobBySunoTaskId, updateJobStatus, createSong, getLeadByJobId, getJobByLyricsTaskId } from "./db";
import { nanoid } from "nanoid";
import { sendToFluxuz, createFluxuzPayload } from "./fluxuz";
import { generateMusicWithSuno, generateMusicWithLyrics } from "./suno";

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
        // Buscar job pelo sunoTaskId (task_id da Suno)
        const job = await getJobBySunoTaskId(task_id);

        if (!job) {
          console.error("[Webhook] Job not found for sunoTaskId:", task_id);
          return res.status(200).json({
            success: false,
            error: "Job not found",
          });
        }

        // Get lead info (nome + whatsapp)
        const jobId = job.id;
        const lead = await getLeadByJobId(jobId);

        // Process all music tracks (Suno usually generates 2 versions)
        console.log(`[Webhook] Processing ${musicData.length} music tracks for job:`, jobId);
        
        const createdSongs = [];
        for (const music of musicData) {
          const audioUrl = music.audio_url;
          const title = music.title || `Música ${jobId}`;
          const lyrics = music.prompt || "";
          const shareSlug = nanoid(8);

          console.log("[Webhook] Creating song variant:", { 
            jobId, 
            title, 
            audioUrl,
          });

          const song = await createSong({
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
          
          if (song) createdSongs.push({ ...song, lyrics, audioUrl, title, shareSlug, imageUrl: music.image_url });
        }

        // Update job status
        await updateJobStatus(jobId, "DONE");
        console.log("[Webhook] Job marked as DONE:", jobId);

        // Send to Fluxuz for WhatsApp dispatch (sending all generated versions)
        if (lead && createdSongs.length > 0) {
          console.log(`[Webhook] Sending ${createdSongs.length} songs to Fluxuz...`);
          
          for (let i = 0; i < createdSongs.length; i++) {
            const song = createdSongs[i];
            const versionTitle = createdSongs.length > 1 ? `${song.title} (Versão ${i + 1})` : song.title;
            
            const fluxuzPayload = createFluxuzPayload(
              `${jobId}_v${i+1}`, // Unique external key per version
              lead.name,
              lead.whatsapp,
              versionTitle,
              song.audioUrl,
              song.shareSlug,
              song.lyrics,
              song.imageUrl
            );
            
            const fluxuzSent = await sendToFluxuz(fluxuzPayload);
            console.log(`[Webhook] Fluxuz sent (v${i+1}):`, fluxuzSent);
          }
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

// Constants for lyrics webhook
const LYRICS_PREVIEW_LENGTH = 150;
const LYRICS_SHORT_PREVIEW_LENGTH = 100;
const DEFAULT_APP_URL = "https://seu-verso-mvp-v2.onrender.com";

/**
 * Handle lyrics generation callback from Suno API
 * When lyrics are ready, trigger music generation with the actual lyrics
 * 
 * Expected callback format:
 * {
 *   "code": 200,
 *   "msg": "All generated successfully.",
 *   "data": {
 *     "callbackType": "complete",
 *     "taskId": "11dc****8b0f",
 *     "data": [
 *       { "text": "...", "title": "...", "status": "complete" }
 *     ]
 *   }
 * }
 */
export async function handleLyricsCallback(req: Request, res: Response) {
  try {
    const body = req.body;
    
    // Log payload structure for debugging (sanitized)
    console.log("[Webhook Lyrics] Callback received:", {
      hasCode: !!body.code,
      hasMsg: !!body.msg,
      hasData: !!body.data,
      dataKeys: body.data ? Object.keys(body.data) : []
    });
    
    const { code, msg, data } = body;

    // Validate basic structure
    if (!data || typeof data !== "object") {
      console.error("[Webhook Lyrics] Invalid payload - missing data object");
      return res.status(200).json({ status: "received", error: "Invalid payload" });
    }

    // Extract taskId (handle both camelCase and snake_case)
    const taskId = data.taskId || data.task_id;
    const callbackType = data.callbackType || data.callback_type;
    const lyricsData = data.data;

    console.log("[Webhook Lyrics] Parsed callback:", {
      code,
      msg,
      callbackType,
      taskId,
      lyricsCount: Array.isArray(lyricsData) ? lyricsData.length : 0
    });

    // Validate taskId before DB query
    if (!taskId) {
      console.error("[Webhook Lyrics] Missing taskId in callback");
      return res.status(200).json({ status: "received", error: "Missing taskId" });
    }

    // Handle errors from Suno
    if (code !== 200 || callbackType === "error") {
      console.error("[Webhook Lyrics] Lyrics generation failed:", { code, msg, callbackType });
      
      try {
        const job = await getJobByLyricsTaskId(taskId);
        if (job) {
          console.log("[Webhook Lyrics] Falling back to direct music generation for job:", job.id);
          await handleLyricsFallback(job.id);
        }
      } catch (fallbackError) {
        console.error("[Webhook Lyrics] Fallback failed:", fallbackError);
      }
      
      return res.status(200).json({ status: "received", error: msg || "Generation failed" });
    }

    // Handle successful lyrics generation
    if (callbackType === "complete" && Array.isArray(lyricsData) && lyricsData.length > 0) {
      console.log("[Webhook Lyrics] Processing complete callback with", lyricsData.length, "lyrics variants");
      
      // Find job by lyricsTaskId
      const job = await getJobByLyricsTaskId(taskId);
      if (!job) {
        console.error("[Webhook Lyrics] Job not found for lyricsTaskId:", taskId);
        return res.status(200).json({ status: "received", error: "Job not found" });
      }

      console.log("[Webhook Lyrics] Found job:", job.id);

      // Find first successful lyrics
      const successfulLyrics = lyricsData.find((l: any) => l.status === "complete");
      if (!successfulLyrics) {
        console.error("[Webhook Lyrics] No successful lyrics in response");
        
        // Log all variants for debugging
        lyricsData.forEach((l: any, i: number) => {
          console.log(`[Webhook Lyrics] Variant ${i + 1}: status=${l.status}, error=${l.errorMessage || 'none'}`);
        });
        
        await handleLyricsFallback(job.id);
        return res.status(200).json({ status: "received", error: "No successful lyrics" });
      }

      const lyrics = successfulLyrics.text;
      const lyricsTitle = successfulLyrics.title || "Música Personalizada";
      
      console.log("[Webhook Lyrics] ✅ Lyrics generated successfully:", {
        jobId: job.id,
        title: lyricsTitle,
        lyricsLength: lyrics.length,
        preview: lyrics.substring(0, LYRICS_PREVIEW_LENGTH).replace(/\n/g, " ") + "..."
      });

      // Update job status
      await updateJobStatus(job.id, "GENERATING_MUSIC");
      console.log("[Webhook Lyrics] Job status updated to GENERATING_MUSIC");

      // Get lead info
      const lead = await getLeadByJobId(job.id);
      if (!lead) {
        console.error("[Webhook Lyrics] Lead not found for job:", job.id);
        return res.status(200).json({ status: "received", error: "Lead not found" });
      }

      // Trigger music generation with ACTUAL LYRICS
      const appUrl = process.env.APP_URL || DEFAULT_APP_URL;
      const musicCallbackUrl = `${appUrl}/api/webhook/suno`;
      
      console.log("[Webhook Lyrics] 🎵 Triggering music generation with lyrics:", {
        jobId: job.id,
        style: lead.style,
        name: lead.name,
        lyricsPreview: lyrics.substring(0, LYRICS_SHORT_PREVIEW_LENGTH) + "..."
      });
      
      const musicTaskId = await generateMusicWithLyrics(
        job.id,
        lyrics,
        lead.style,
        lead.name,
        musicCallbackUrl
      );

      console.log("[Webhook Lyrics] ✅ Music generation triggered:", { musicTaskId });

      return res.status(200).json({ 
        status: "received", 
        message: "Lyrics processed, music generation started",
        musicTaskId 
      });
    }

    // Handle intermediate callbacks (should not happen for lyrics, but be safe)
    console.log("[Webhook Lyrics] Non-complete callback type:", callbackType);
    return res.status(200).json({ status: "received" });
    
  } catch (error: any) {
    console.error("[Webhook Lyrics] Unexpected error:", error.message || error);
    console.error("[Webhook Lyrics] Stack:", error.stack);
    
    // Always return 200 to prevent Suno from retrying
    return res.status(200).json({ status: "received", error: "Internal error" });
  }
}

/**
 * Fallback function when lyrics generation fails
 * Generates music directly with the original prompt
 */
async function handleLyricsFallback(jobId: string) {
  console.log("[Webhook Lyrics] Starting fallback for job:", jobId);
  
  try {
    const lead = await getLeadByJobId(jobId);
    if (!lead) {
      console.error("[Webhook Lyrics] Fallback failed - lead not found:", jobId);
      return;
    }

    await updateJobStatus(jobId, "GENERATING_MUSIC");
    
    const appUrl = process.env.APP_URL || DEFAULT_APP_URL;
    const callbackUrl = `${appUrl}/api/webhook/suno`;
    
    console.log("[Webhook Lyrics] Fallback - generating music directly:", {
      jobId,
      style: lead.style,
      name: lead.name
    });
    
    await generateMusicWithSuno(
      jobId,
      lead.story,
      lead.style,
      lead.name,
      lead.occasion || undefined,
      lead.mood || undefined,
      lead.language || undefined,
      callbackUrl
    );
    
    console.log("[Webhook Lyrics] Fallback - music generation triggered");
  } catch (error: any) {
    console.error("[Webhook Lyrics] Fallback error:", error.message || error);
    await updateJobStatus(jobId, "FAILED");
  }
}
