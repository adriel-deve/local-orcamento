-- Adicionar coluna user_id à tabela quotes para suportar multi-usuários

-- Adicionar coluna user_id
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Adicionar foreign key para a tabela users
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes (user_id);
