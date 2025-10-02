-- Adicionar novos campos de status para cotações
USE `orcamentos`;

-- Adicionar novos status às cotações
ALTER TABLE `quotes`
ADD COLUMN IF NOT EXISTS `business_status` ENUM('ativa', 'baixa', 'pedido_compra', 'finalizada') DEFAULT 'ativa' COMMENT 'Status de negócio da cotação',
ADD COLUMN IF NOT EXISTS `purchase_order` VARCHAR(128) DEFAULT NULL COMMENT 'Número do pedido de compra',
ADD COLUMN IF NOT EXISTS `closed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Data de finalização',
ADD COLUMN IF NOT EXISTS `closed_by` INT NULL DEFAULT NULL COMMENT 'Usuário que finalizou',
ADD COLUMN IF NOT EXISTS `baixa_reason` TEXT NULL DEFAULT NULL COMMENT 'Motivo da baixa',
ADD COLUMN IF NOT EXISTS `baixa_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Data da baixa',
ADD COLUMN IF NOT EXISTS `baixa_by` INT NULL DEFAULT NULL COMMENT 'Usuário que deu baixa';

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS `idx_quotes_business_status` ON `quotes` (`business_status`);
CREATE INDEX IF NOT EXISTS `idx_quotes_supplier` ON `quotes` (`supplier`);
CREATE INDEX IF NOT EXISTS `idx_quotes_client` ON `quotes` (`client`);
CREATE INDEX IF NOT EXISTS `idx_quotes_user_id` ON `quotes` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_quotes_status` ON `quotes` (`status`);
