-- Migração: Adicionar coluna 'optional' à tabela items
-- Esta coluna marca itens como opcionais, que aparecem na cotação mas não contam no total

-- Adicionar coluna optional (padrão false)
ALTER TABLE items ADD COLUMN IF NOT EXISTS optional BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN items.optional IS 'Marca o item como opcional (não conta no total)';

-- Verificação
SELECT 'Coluna optional adicionada com sucesso!' AS status;
