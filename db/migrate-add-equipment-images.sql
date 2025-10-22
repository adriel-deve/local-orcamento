-- Adicionar coluna equipment_images para armazenar múltiplas imagens de equipamentos
-- Esta coluna armazena um JSON com as imagens de cada seção

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS equipment_images TEXT DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN quotes.equipment_images IS 'JSON array contendo URLs de imagens de equipamentos para cada seção';
