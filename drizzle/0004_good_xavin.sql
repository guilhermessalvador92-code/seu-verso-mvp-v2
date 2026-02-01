ALTER TABLE `leads` ADD `whatsapp` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `language` varchar(10) DEFAULT 'pt-BR' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `names`;--> statement-breakpoint
ALTER TABLE `songs` DROP COLUMN `emailSent`;
