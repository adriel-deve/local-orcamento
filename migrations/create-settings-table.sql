-- Tabela de configurações padrão para formulários
CREATE TABLE IF NOT EXISTS form_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  category VARCHAR(50),
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id)
);

-- Inserir valores padrão iniciais
INSERT INTO form_settings (key, value, category, description) VALUES
  ('default_company', '', 'quote', 'Nome da empresa padrão'),
  ('default_representative', '', 'quote', 'Representante padrão'),
  ('default_validity_days', '15', 'quote', 'Prazo de validade padrão (dias)'),
  ('default_delivery_time', '', 'quote', 'Prazo de entrega padrão'),
  ('default_services', '', 'quote', 'Serviços padrão'),
  ('default_payment_intro', '', 'payment', 'Introdução de pagamento padrão'),
  ('default_payment_usd_conditions', '', 'payment', 'Condições de pagamento USD padrão'),
  ('default_payment_brl_intro', '', 'payment', 'Introdução pagamento BRL padrão'),
  ('default_payment_brl_with_sat', '', 'payment', 'Pagamento BRL com SAT padrão'),
  ('default_payment_brl_without_sat', '', 'payment', 'Pagamento BRL sem SAT padrão'),
  ('default_payment_additional_notes', '', 'payment', 'Notas adicionais de pagamento padrão')
ON CONFLICT (key) DO NOTHING;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_form_settings_category ON form_settings(category);
