/**
 * Lyrics API Routes
 * Premium feature: Generate and manage lyrics before creating music
 */

import { Router } from "express";
import { nanoid } from "nanoid";
import { lyricsSessionManager } from "./lyrics-session";
import { generateLyrics, getLyricsStatus } from "./suno-lyrics";

const router = Router();

/**
 * POST /api/lyrics/generate
 * Generate lyrics (creates a new "page" with 2 options)
 * Max 3 pages per session
 */
router.post("/generate", async (req, res) => {
  try {
    const { sessionId: existingSessionId, wizard } = req.body;

    if (!wizard || !wizard.prompt) {
      return res.status(400).json({
        error: "Missing required field: wizard.prompt",
      });
    }

    // Create or get session
    const sessionId = existingSessionId || nanoid();
    let session = lyricsSessionManager.getSession(sessionId);

    if (!session) {
      session = lyricsSessionManager.createSession(sessionId);
    }

    // Check if max pages reached
    const remainingRegens = lyricsSessionManager.getRemainingRegens(sessionId);
    if (remainingRegens <= 0) {
      return res.status(429).json({
        error: "Maximum 3 regenerations per session exceeded",
        sessionId,
        remainingRegens: 0,
      });
    }

    // Generate lyrics via Suno
    const callbackUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/suno-lyrics`;
    const result = await generateLyrics(wizard.prompt, callbackUrl);

    if (result.code !== 200) {
      return res.status(500).json({
        error: "Failed to generate lyrics",
        details: result.msg,
      });
    }

    // Add page to session
    const pageNumber = session.pages.size + 1;
    lyricsSessionManager.addPage(sessionId, pageNumber, result.data.taskId);

    res.json({
      sessionId,
      pageNumber,
      taskId: result.data.taskId,
      remainingRegens: lyricsSessionManager.getRemainingRegens(sessionId),
    });
  } catch (error: any) {
    console.error("[Lyrics API] Generate error:", error);

    if (error.message.includes("Maximum")) {
      return res.status(429).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /api/lyrics/status/:taskId
 * Check lyrics generation status
 */
router.get("/status/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        error: "Missing taskId",
      });
    }

    const result = await getLyricsStatus(taskId);

    if (result.code !== 200) {
      return res.status(500).json({
        error: "Failed to get lyrics status",
        details: result.msg,
      });
    }

    const { status, response } = result.data;
    const lyrics = response?.data || [];

    // If success, update session (find by taskId)
    if (status === "SUCCESS" && lyrics && lyrics.length > 0) {
      // Find session by taskId
      const allSessions = Array.from((lyricsSessionManager as any).sessions.values());
      for (const session of allSessions) {
        for (const [pageNumber, page] of session.pages.entries()) {
          if (page.taskId === taskId && page.status === "PENDING") {
            lyricsSessionManager.updatePageStatus(
              session.sessionId,
              pageNumber,
              "SUCCESS",
              lyrics.map((l, index) => ({
                text: l.text,
                title: l.title,
                index,
              }))
            );
            break;
          }
        }
      }
    }

    res.json({
      taskId,
      status,
      lyrics: lyrics.map((l, index) => ({
        text: l.text,
        title: l.title,
        index,
      })),
    });
  } catch (error: any) {
    console.error("[Lyrics API] Status error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /api/lyrics/session/:sessionId
 * Get full session data
 */
router.get("/session/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = lyricsSessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    // Convert Map to array for JSON
    const pages = Array.from(session.pages.values());

    res.json({
      sessionId: session.sessionId,
      pages,
      selectedPage: session.selectedPage,
      selectedOption: session.selectedOption,
      remainingRegens: lyricsSessionManager.getRemainingRegens(sessionId),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error: any) {
    console.error("[Lyrics API] Get session error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /api/lyrics/session/:sessionId/page/:pageNumber
 * Get specific page data
 */
router.get("/session/:sessionId/page/:pageNumber", (req, res) => {
  try {
    const { sessionId, pageNumber } = req.params;
    const pageNum = parseInt(pageNumber, 10);

    if (isNaN(pageNum)) {
      return res.status(400).json({
        error: "Invalid page number",
      });
    }

    const page = lyricsSessionManager.getPage(sessionId, pageNum);
    if (!page) {
      return res.status(404).json({
        error: "Page not found",
      });
    }

    res.json(page);
  } catch (error: any) {
    console.error("[Lyrics API] Get page error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * POST /api/lyrics/session/:sessionId/select
 * Select a lyrics option from a page
 */
router.post("/session/:sessionId/select", (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pageNumber, optionIndex } = req.body;

    if (pageNumber === undefined || optionIndex === undefined) {
      return res.status(400).json({
        error: "Missing required fields: pageNumber, optionIndex",
      });
    }

    lyricsSessionManager.selectOption(sessionId, pageNumber, optionIndex);

    const selectedLyrics = lyricsSessionManager.getSelectedLyrics(sessionId);

    res.json({
      success: true,
      sessionId,
      pageNumber,
      optionIndex,
      selectedLyrics,
    });
  } catch (error: any) {
    console.error("[Lyrics API] Select error:", error);

    if (error.message.includes("not found") || error.message.includes("Invalid")) {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message.includes("not ready")) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

export default router;
