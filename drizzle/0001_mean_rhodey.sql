CREATE TABLE `bio_blocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`type` enum('heading','description','text','link','social','divider','profile_image') NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`data` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bio_blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bio_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`slug` varchar(100) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`profileImageUrl` text,
	`theme` varchar(50) NOT NULL DEFAULT 'dark',
	`accentColor` varchar(20) NOT NULL DEFAULT '#DFFF00',
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bio_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `bio_pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `short_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`originalUrl` text NOT NULL,
	`code` varchar(20) NOT NULL,
	`clicks` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `short_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `short_links_code_unique` UNIQUE(`code`)
);
