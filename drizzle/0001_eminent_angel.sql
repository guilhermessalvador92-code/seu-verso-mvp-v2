CREATE TABLE `jobs` (
	`id` varchar(64) NOT NULL,
	`status` enum('QUEUED','PROCESSING','DONE','FAILED') NOT NULL DEFAULT 'QUEUED',
	`sunoTaskId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` varchar(64) NOT NULL,
	`jobId` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`style` varchar(64) NOT NULL,
	`names` text NOT NULL,
	`occasion` text,
	`story` text NOT NULL,
	`mood` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` varchar(64) NOT NULL,
	`jobId` varchar(64) NOT NULL,
	`title` text,
	`lyrics` text,
	`audioUrl` text,
	`shareSlug` varchar(128),
	`emailSent` timestamp,
	`downloadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `songs_id` PRIMARY KEY(`id`),
	CONSTRAINT `songs_shareSlug_unique` UNIQUE(`shareSlug`)
);
