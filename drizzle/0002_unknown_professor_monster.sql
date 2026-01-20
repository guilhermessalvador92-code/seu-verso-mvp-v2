CREATE TABLE `emailQueue` (
	`id` varchar(64) NOT NULL,
	`to` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlContent` text NOT NULL,
	`type` enum('ORDER_CONFIRMATION','MUSIC_READY','NOTIFICATION') NOT NULL,
	`jobId` varchar(64),
	`status` enum('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 5,
	`nextRetryAt` timestamp,
	`lastError` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailQueue_id` PRIMARY KEY(`id`)
);
