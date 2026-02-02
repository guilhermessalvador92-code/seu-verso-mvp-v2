/**
 * Music API Routes
 * Premium feature: Start music generation with custom lyrics
 */

import { Router } from "express";
import { nanoid } from "nanoid";
import { lyricsSessionManager } from "./lyrics-session";
// No env import needed - using process.env directly

const router = Router();

// In-memory storage for taskId -> client mapping (for webhook)
export const musicTaskRegistry = new Map<string, {
  name: string;
  whatsapp: string;
  sessionId: string;
  createdAt: Date;
}>();

const SUNO_BASE_URL = process.env.SUNO_BASE_URL || "https://api.sunoapi.org/api/v1";
const SUNO_API_KEY = process.env.SUNO_API_KEY || "";
const BACKEND_URL = process.env.BACKEND_URL || process.env.APP_URL;

/**
 * POST /api/music/start
 * Start music generation with selected lyrics (custom mode)
 */
router.post("/start", async (req, res) => {
  try {
    const {
      sessionId,
      pageNumber,
      optionIndex,
      client,
      style,
      title,
      model,
    } = req.body;

    // Validate required fields
    if (!sessionId || pageNumber === undefined || optionIndex === undefined) {
      return res.status(400).json({
        error: "Missing required fields: sessionId, pageNumber, optionIndex",
      });
    }

    if (!client || !client.name || !client.whatsapp) {
      return res.status(400).json({
        error: "Missing required client fields: name, whatsapp",
      });
    }

    // Get selected lyrics
    const session = lyricsSessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    const page = lyricsSessionManager.getPage(sessionId, pageNumber);
    if (!page) {
      return res.status(404).json({
        error: "Page not found",
      });
    }

    if (page.status !== "SUCCESS") {
      return res.status(400).json({
        error: "Lyrics not ready yet",
      });
    }

    const selectedLyrics = page.options[optionIndex];
    if (!selectedLyrics) {
      return res.status(404).json({
        error: "Invalid option index",
      });
    }

    // Mark as selected in session
    lyricsSessionManager.selectOption(sessionId, pageNumber, optionIndex);

    // Call Suno Generate Music API with custom mode
    const callbackUrl = `${BACKEND_URL}/api/webhooks/suno`;

    console.log("[Music API] Starting music generation...", {
      sessionId,
      pageNumber,
      optionIndex,
      client: client.name,
      callbackUrl,
    });

    const response = await fetch(`${SUNO_BASE_URL}/music/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": SUNO_API_KEY,
      },
      body: JSON.stringify({
        customMode: true,
        instrumental: false,
        prompt: selectedLyrics.text,
        style: style || "pop",
        title: title || "Custom Song",
        model: model || "chirp-v3-5",
        callBackUrl: callbackUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Music API] Suno API error", {
        status: response.status,
        error,
      });
      return res.status(500).json({
        error: "Failed to start music generation",
        details: error,
      });
    }

    const result = await response.json();

    if (result.code !== 200) {
      console.error("[Music API] Suno API returned error", result);
      return res.status(500).json({
        error: "Failed to start music generation",
        details: result.msg,
      });
    }

    const taskId = result.data.task_id;

    // Register task for webhook
    musicTaskRegistry.set(taskId, {
      name: client.name,
      whatsapp: client.whatsapp,
      sessionId,
      createdAt: new Date(),
    });

    console.log("[Music API] Music generation started", {
      taskId,
      client: client.name,
    });

    res.json({
      success: true,
      taskId,
      sessionId,
      callbackUrl,
      message: "Music generation started. You will receive a WhatsApp message when ready.",
    });
  } catch (error: any) {
    console.error("[Music API] Start error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /api/music/status/:taskId
 * Check music generation status (optional, for polling)
 */
router.get("/status/:taskId", (req, res) => {
  try {
    const { taskId } = req.params;

    const task = musicTaskRegistry.get(taskId);
    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.json({
      taskId,
      status: "PROCESSING",
      message: "Music is being generated. You will receive a WhatsApp message when ready.",
      createdAt: task.createdAt,
    });
  } catch (error: any) {
    console.error("[Music API] Status error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Cleanup old tasks (call periodically)
setInterval(() => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [taskId, task] of musicTaskRegistry.entries()) {
    if (now.getTime() - task.createdAt.getTime() > maxAge) {
      musicTaskRegistry.delete(taskId);
    }
  }
}, 60 * 60 * 1000); // Every hour

export default router;
