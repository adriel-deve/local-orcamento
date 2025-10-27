-- Criação das tabelas para orçamentos (PostgreSQL/Neon)

-- Cotação principal
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  quote_code VARCHAR(255) NOT NULL UNIQUE,
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
CREATE TABLE IF NOT EXISTS specs (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL,
  spec_index INTEGER NOT NULL,
  description TEXT,
  image_path VARCHAR(512) DEFAULT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  UNIQUE(quote_id, spec_index)
);

-- Itens por especificação
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL,
  spec_index INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) DEFAULT 0,
  qty INTEGER DEFAULT 1,
  currency VARCHAR(10) DEFAULT 'BRL',
  days INTEGER DEFAULT NULL,
  optional BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_items_quote ON items (quote_id);
CREATE INDEX IF NOT EXISTS idx_specs_quote ON specs (quote_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE
    ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();