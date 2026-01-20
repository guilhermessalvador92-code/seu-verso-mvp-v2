/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export const MUSIC_STYLES = [
  "Sertanejo",
  "Pop",
  "Rock",
  "MPB",
  "Gospel",
  "Funk",
  "Romântica 80/90",
  "Soul/Groove",
] as const;

export type MusicStyle = (typeof MUSIC_STYLES)[number];

export const MOODS = ["Emocionante", "Alegre", "Engraçado", "Épico"] as const;

export type Mood = (typeof MOODS)[number];

export const JOB_STATUSES = ["QUEUED", "PROCESSING", "DONE", "FAILED"] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STEPS = [
  { key: "step1", label: "Roteirizando história" },
  { key: "step2", label: "Compondo letra" },
  { key: "step3", label: "Produzindo melodia" },
  { key: "step4", label: "Mixando e finalizando" },
] as const;

export interface CreateJobPayload {
  story: string;
  style: MusicStyle;
  names: string;
  occasion?: string;
  mood?: Mood;
  email: string;
  agreedToTerms: boolean;
}

export interface JobResponse {
  jobId: string;
  statusUrl: string;
}

export interface JobStatusResponse {
  status: JobStatus;
  song?: {
    shareSlug: string;
    audioUrl: string;
    lyrics: string;
    title: string;
  };
}

export interface CallbackPayload {
  jobId: string;
  title: string;
  lyrics: string;
  audioUrl: string;
}
