-- ============================================
-- SETUP COMPLETO DO SISTEMA DE AUTENTICAÇÃO
-- COPIE TODO ESTE ARQUIVO E COLE NO CONSOLE SQL DO NEON
-- ============================================

-- 1. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Adicionar coluna user_id à tabela quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- 3. Adicionar foreign key para a tabela users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotes_user_id'
  ) THEN
    ALTER TABLE quotes ADD CONSTRAINT fk_quotes_user_id
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes (user_id);

-- 5. Criar tabela de sessões para express-session
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- 6. Criar usuário administrador inicial
-- Username: admin
-- Password: admin123
-- IMPORTANTE: Alterar a senha após o primeiro login!
INSERT INTO users (username, password_hash, full_name, email, role, active)
VALUES (
  'admin',
  '$2b$10$YZNmLIN32G1xj1YdCmqPuudyco6QLQt8un0ZbZmWagM4kFd7T6pcC',
  'Administrador',
  'admin@pharmatec.com',
  'admin',
  TRUE
)
ON CONFLICT (username) DO NOTHING;

-- 7. Trigger para updated_at automático em users (usa a função já existente)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificações finais
SELECT 'Setup concluído com sucesso!' AS status;
