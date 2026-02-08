-- Add lyricsTaskId column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "lyricsTaskId" VARCHAR(128);
