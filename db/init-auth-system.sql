-- Inicialização do sistema de autenticação

-- Criar tabela de sessões para express-session
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- Criar usuário administrador inicial
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

-- Note: A senha 'admin123' acima está hasheada com bcrypt.
-- Para alterar a senha, use o sistema após fazer login.
