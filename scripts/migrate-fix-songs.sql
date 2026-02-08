-- Migration: Fix leads table structure
-- This ensures the table structure matches the current schema

-- Drop emailQueue table if it exists (no longer used)
DROP TABLE IF EXISTS "emailQueue";

-- Migration: Add lyricsTaskId column to jobs table (for lyrics generation flow)
-- This is safe to run multiple times due to IF NOT EXISTS pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'lyricsTaskId'
  ) THEN
    ALTER TABLE jobs ADD COLUMN "lyricsTaskId" varchar(128);
    RAISE NOTICE 'Added lyricsTaskId column to jobs table';
  ELSE
    RAISE NOTICE 'lyricsTaskId column already exists in jobs table';
  END IF;
END $$;

-- Migration: Update status CHECK constraint to include new statuses
-- First drop the old constraint, then add the new one
DO $$
BEGIN
  -- Try to drop old constraint (may not exist with this name)
  ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Constraint doesn't exist, that's fine
END $$;

-- Add the new CHECK constraint with all statuses
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('QUEUED', 'GENERATING_LYRICS', 'GENERATING_MUSIC', 'PROCESSING', 'DONE', 'FAILED'));

-- Verify migration
SELECT 'Migration complete' as status;
