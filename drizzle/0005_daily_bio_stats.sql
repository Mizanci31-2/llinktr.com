ALTER TABLE `bio_pages` ADD COLUMN `todayClicks` int NOT NULL DEFAULT 0;
ALTER TABLE `bio_pages` ADD COLUMN `todayViews` int NOT NULL DEFAULT 0;
ALTER TABLE `bio_pages` ADD COLUMN `statsDate` varchar(10);
