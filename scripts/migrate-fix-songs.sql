-- Migration: Fix leads table - remove email, add whatsapp and name columns
-- This ensures the table structure matches the new schema (WhatsApp only, no email)

-- Drop emailQueue table if it exists (no longer used)
DROP TABLE IF EXISTS `emailQueue`;

-- Remove email column from leads if it exists
ALTER TABLE `leads` DROP COLUMN IF EXISTS `email`;

-- Add whatsapp column if it doesn't exist
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `whatsapp` varchar(20) NOT NULL DEFAULT '';

-- Add name column if it doesn't exist  
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `name` text;

-- Ensure jobId exists in leads
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `jobId` varchar(64) NOT NULL DEFAULT 'unknown';

-- Ensure jobId exists in songs
ALTER TABLE `songs` ADD COLUMN IF NOT EXISTS `jobId` varchar(64) NOT NULL DEFAULT 'unknown';

-- Verify migration
SELECT 'Migration complete' as status;
