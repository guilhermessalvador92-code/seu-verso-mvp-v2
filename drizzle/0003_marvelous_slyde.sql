ALTER TABLE `songs` ADD `imageUrl` text;--> statement-breakpoint
ALTER TABLE `songs` ADD `duration` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `songs` ADD `tags` varchar(255);--> statement-breakpoint
ALTER TABLE `songs` ADD `modelName` varchar(64);