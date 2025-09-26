-- Script SQL para configurar as tabelas no Neon PostgreSQL
-- Execute este script diretamente no console do Neon ou via psql

-- Drop tables if exist (para recriar do zero)
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS specs CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;

-- Cotação principal com TODOS os campos necessários
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  quote_code VARCHAR(32) NOT NULL UNIQUE,
  date DATE NOT NULL,
  company VARCHAR(255) NOT NULL,
  client VARCHAR(255) DEFAULT NULL,
  cnpj VARCHAR(20) DEFAULT NULL,
  machine_model VARCHAR(255) DEFAULT NULL,
  tech_spec TEXT DEFAULT NULL,
  principle TEXT DEFAULT NULL,
  representative VARCHAR(255) NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  services VARCHAR(512) DEFAULT '',
  validity_days INTEGER DEFAULT 15,
  delivery_time VARCHAR(128) DEFAULT NULL,
  notes TEXT,
  status VARCHAR(32) DEFAULT 'Rascunho',
  contact_email VARCHAR(255) DEFAULT NULL,
  contact_phone VARCHAR(50) DEFAULT NULL,
  seller_name VARCHAR(255) DEFAULT NULL,
  equipment_image VARCHAR(512) DEFAULT NULL,
  include_payment_conditions BOOLEAN DEFAULT FALSE,
  payment_intro TEXT DEFAULT NULL,
  payment_usd_conditions TEXT DEFAULT NULL,
  payment_brl_intro TEXT DEFAULT NULL,
  payment_brl_with_sat TEXT DEFAULT NULL,
  payment_brl_without_sat TEXT DEFAULT NULL,
  payment_additional_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Especificações
CREATE TABLE specs (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL,
  spec_index INTEGER NOT NULL,
  description TEXT,
  image_path VARCHAR(512) DEFAULT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  UNIQUE(quote_id, spec_index)
);

-- Itens por especificação com TODOS os campos
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL,
  spec_index INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) DEFAULT 0,
  qty INTEGER DEFAULT 1,
  currency VARCHAR(10) DEFAULT 'BRL',
  days INTEGER DEFAULT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_items_quote ON items (quote_id);
CREATE INDEX idx_specs_quote ON specs (quote_id);
CREATE INDEX idx_quotes_status ON quotes (status);
CREATE INDEX idx_quotes_created ON quotes (created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de teste
INSERT INTO quotes (
  quote_code, date, company, client, representative, supplier, status, notes
) VALUES (
  'NEON-TEST-001',
  CURRENT_DATE,
  'Empresa Teste Neon',
  'Cliente Teste',
  'Representante Teste',
  'Fornecedor Teste',
  'Rascunho',
  'Cotação de teste para verificar funcionamento'
);

-- Verificar se as tabelas foram criadas
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
SELECT COUNT(*) as total_quotes FROM quotes;

-- Exibir estrutura das tabelas
\d quotes
\d specs
\d items