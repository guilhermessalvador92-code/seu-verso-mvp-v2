-- Migration: Fix leads table - rename 'names' to 'name', add whatsapp
-- This ensures the table structure matches the new schema

-- Drop emailQueue table if it exists (no longer used)
DROP TABLE IF EXISTS `emailQueue`;

-- Remove email column from leads if it exists
ALTER TABLE `leads` DROP COLUMN IF EXISTS `email`;

-- Rename 'names' to 'name' if 'names' exists
ALTER TABLE `leads` CHANGE COLUMN IF EXISTS `names` `name` text;

-- Add name column if it doesn't exist (in case rename didn't work)
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `name` text DEFAULT '';

-- Add whatsapp column if it doesn't exist
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `whatsapp` varchar(20) NOT NULL DEFAULT '';

-- Ensure jobId exists in leads
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `jobId` varchar(64) NOT NULL DEFAULT 'unknown';

-- Ensure jobId exists in songs
ALTER TABLE `songs` ADD COLUMN IF NOT EXISTS `jobId` varchar(64) NOT NULL DEFAULT 'unknown';

-- Verify migration
SELECT 'Migration complete' as status;
