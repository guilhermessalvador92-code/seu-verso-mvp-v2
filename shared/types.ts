/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export const MUSIC_STYLES = [
  "Sertanejo",
  "Pop", 
  "Pop Rock",
  "Rock",
  "MPB",
  "Gospel",
  "Funk Carioca",
  "Romântica 80/90",
  "Soul/Groove",
  "Forró",
  "Samba",
  "Pagode", 
  "Metal",
  "Trap",
  "Hip Hop",
  "Eletrônica",
  "Bolero",
  "Reggae",
] as const;

export type MusicStyle = (typeof MUSIC_STYLES)[number];

export const MOODS = [
  "Emocionante", 
  "Alegre", 
  "Engraçado", 
  "Épico", 
  "Romântico", 
  "Nostálgico", 
  "Inspirador", 
  "Calmo/Relaxante", 
  "Energético", 
  "Melancólico", 
  "Motivacional", 
  "Sensual"
] as const;

export type Mood = (typeof MOODS)[number];

export const LANGUAGES = [
  "Português Brasileiro",
  "Espanhol",
  "Inglês Americano",
  "Inglês Britânico",
] as const;

export type Language = (typeof LANGUAGES)[number];

export const OCCASIONS = [
  "Aniversário",
  "Casamento",
  "Serenata Romântica",
  "Mensagem Positiva",
  "Jingle Político",
  "Meme (Brincadeira)",
] as const;

export type Occasion = (typeof OCCASIONS)[number];

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
  occasion?: Occasion;
  mood?: Mood;
  language?: Language;
  voiceGender?: "Masculina" | "Feminina";
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
