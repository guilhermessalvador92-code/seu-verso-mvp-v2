/**
 * Suno Lyrics API Client
 * Handles lyrics generation and status checking
 */

// No env import needed - using process.env directly

const SUNO_BASE_URL = process.env.SUNO_BASE_URL || "https://api.sunoapi.org/api/v1";
const SUNO_API_KEY = process.env.SUNO_API_KEY || "";

export interface GenerateLyricsRequest {
  prompt: string;
}

export interface GenerateLyricsResponse {
  code: number;
  msg: string;
  data: {
    task_id: string;
  };
}

export interface LyricsStatusResponse {
  code: number;
  msg: string;
  data: {
    task_id: string;
    status: string; // "pending" | "success" | "failed"
    lyrics?: Array<{
      text: string;
      title?: string;
    }>;
  };
}

export async function generateLyrics(prompt: string): Promise<GenerateLyricsResponse> {
  console.log("[Suno Lyrics] Generating lyrics...", { prompt: prompt.substring(0, 100) });

  const response = await fetch(`${SUNO_BASE_URL}/lyrics/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": SUNO_API_KEY,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Suno Lyrics] Generation failed", {
      status: response.status,
      error,
    });
    throw new Error(`Suno Lyrics API error: ${response.status} ${error}`);
  }

  const data: GenerateLyricsResponse = await response.json();
  console.log("[Suno Lyrics] Generation started", { taskId: data.data.task_id });
  return data;
}

export async function getLyricsStatus(taskId: string): Promise<LyricsStatusResponse> {
  console.log("[Suno Lyrics] Checking status...", { taskId });

  const response = await fetch(`${SUNO_BASE_URL}/lyrics/record-info?taskId=${taskId}`, {
    method: "GET",
    headers: {
      "api-key": SUNO_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Suno Lyrics] Status check failed", {
      status: response.status,
      error,
    });
    throw new Error(`Suno Lyrics API error: ${response.status} ${error}`);
  }

  const data: LyricsStatusResponse = await response.json();
  console.log("[Suno Lyrics] Status retrieved", {
    taskId,
    status: data.data.status,
    lyricsCount: data.data.lyrics?.length || 0,
  });
  return data;
}
