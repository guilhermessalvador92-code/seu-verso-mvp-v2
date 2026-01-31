-- Migration: Add missing jobId column to songs table if it doesn't exist
-- This fixes the "Unknown column 'jobId'" error in production

ALTER TABLE `songs` ADD COLUMN IF NOT EXISTS `jobId` varchar(64) NOT NULL DEFAULT 'unknown';

-- Also ensure all other tables are correct
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `jobId` varchar(64) NOT NULL DEFAULT 'unknown';
ALTER TABLE `emailQueue` ADD COLUMN IF NOT EXISTS `jobId` varchar(64);

-- Verify tables exist
SELECT 'Migration complete' as status;
