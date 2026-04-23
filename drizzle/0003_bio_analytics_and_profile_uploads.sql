ALTER TABLE `bio_pages` MODIFY COLUMN `profileImageUrl` longtext;
ALTER TABLE `bio_pages` MODIFY COLUMN `theme` varchar(50) NOT NULL DEFAULT 'dark_grid';
ALTER TABLE `bio_pages` ADD `views` int NOT NULL DEFAULT 0;
ALTER TABLE `bio_blocks` ADD `clicks` int NOT NULL DEFAULT 0;
