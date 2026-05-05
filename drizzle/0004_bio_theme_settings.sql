ALTER TABLE `bio_pages` ADD COLUMN `selected_theme_id` varchar(50);
ALTER TABLE `bio_pages` ADD COLUMN `text_color` varchar(20) DEFAULT '#F8FAFC';
ALTER TABLE `bio_pages` ADD COLUMN `custom_background_image_url` longtext;
ALTER TABLE `bio_pages` ADD COLUMN `theme_category` varchar(24);
