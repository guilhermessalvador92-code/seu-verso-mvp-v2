-- Migration: Fix leads table - add whatsapp and name columns
-- Remove email-related columns
-- This ensures the table structure matches the new schema

-- Add missing columns to leads table
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `whatsapp` varchar(20) NOT NULL DEFAULT '';
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `name` text;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `jobId` varchar(64) NOT NULL DEFAULT 'unknown';

-- Add missing columns to songs table
ALTER TABLE `songs` ADD COLUMN IF NOT EXISTS `jobId` varchar(64) NOT NULL DEFAULT 'unknown';

-- Remove email-related tables if they exist (no longer used)
DROP TABLE IF EXISTS `emailQueue`;

-- Verify migration
SELECT 'Migration complete' as status;
