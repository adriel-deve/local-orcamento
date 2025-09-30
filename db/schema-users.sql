-- Schema para sistema de autenticação e usuários

-- Tabela de usuários
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

-- Adicionar coluna user_id na tabela quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Índice para melhorar performance de busca por usuário
CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes (user_id);

-- Criar usuário admin padrão (senha: admin123)
-- Hash bcrypt para 'admin123': $2b$10$rKZE8VQ5YvJvKkqZ5V5V0e7Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Zu
INSERT INTO users (username, password_hash, full_name, role, email)
VALUES ('admin', '$2b$10$YourBcryptHashHere', 'Administrador', 'admin', 'admin@pharmatec.com')
ON CONFLICT (username) DO NOTHING;

-- Trigger para updated_at automático em users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
