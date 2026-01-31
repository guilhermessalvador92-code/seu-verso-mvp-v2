-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `openId` varchar(64) NOT NULL UNIQUE,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` varchar(64) PRIMARY KEY,
  `status` enum('QUEUED','PROCESSING','DONE','FAILED') NOT NULL DEFAULT 'QUEUED',
  `sunoTaskId` varchar(128),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create songs table
CREATE TABLE IF NOT EXISTS `songs` (
  `id` varchar(64) PRIMARY KEY,
  `jobId` varchar(64) NOT NULL,
  `title` text,
  `lyrics` text,
  `audioUrl` text,
  `imageUrl` text,
  `duration` int DEFAULT 0,
  `tags` varchar(255),
  `modelName` varchar(64),
  `shareSlug` varchar(128) UNIQUE,
  `emailSent` timestamp,
  `downloadCount` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create leads table
CREATE TABLE IF NOT EXISTS `leads` (
  `id` varchar(64) PRIMARY KEY,
  `jobId` varchar(64) NOT NULL,
  `email` varchar(320) NOT NULL,
  `style` varchar(64) NOT NULL,
  `names` text NOT NULL,
  `occasion` text,
  `story` text NOT NULL,
  `mood` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create emailQueue table
CREATE TABLE IF NOT EXISTS `emailQueue` (
  `id` varchar(64) PRIMARY KEY,
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
