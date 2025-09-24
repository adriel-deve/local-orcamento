-- Criação do banco e tabelas para orçamentos
CREATE DATABASE IF NOT EXISTS `orcamentos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `orcamentos`;

-- Cotação principal
CREATE TABLE IF NOT EXISTS `quotes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quote_code` VARCHAR(32) NOT NULL,
  `date` DATE NOT NULL,
  `company` VARCHAR(255) NOT NULL,
  `representative` VARCHAR(255) NOT NULL,
  `supplier` VARCHAR(255) NOT NULL,
  `services` VARCHAR(512) DEFAULT '',
  `validity_days` INT DEFAULT 15,
  `delivery_time` VARCHAR(128) DEFAULT NULL,
  `notes` TEXT,
  `status` VARCHAR(32) DEFAULT 'Rascunho',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_quote_code` (`quote_code`)
);

-- Especificações
CREATE TABLE IF NOT EXISTS `specs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quote_id` INT NOT NULL,
  `spec_index` INT NOT NULL,
  `description` TEXT,
  `image_path` VARCHAR(512) DEFAULT NULL,
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_quote_spec` (`quote_id`,`spec_index`)
);

-- Itens por especificação
CREATE TABLE IF NOT EXISTS `items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quote_id` INT NOT NULL,
  `spec_index` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE CASCADE
);

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS `idx_items_quote` ON `items` (`quote_id`);
CREATE INDEX IF NOT EXISTS `idx_specs_quote` ON `specs` (`quote_id`);
