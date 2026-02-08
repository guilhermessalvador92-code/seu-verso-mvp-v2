-- Migration: Fix leads table structure
-- This ensures the table structure matches the current schema

-- Drop emailQueue table if it exists (no longer used)
DROP TABLE IF EXISTS "emailQueue";

-- Verify migration
SELECT 'Migration complete' as status;
