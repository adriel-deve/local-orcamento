-- Adicionar novos campos de configuração

-- Configurações de contato e vendedor
INSERT INTO form_settings (key, value, category, description) VALUES
  ('default_seller_name', '', 'contact', 'Nome do vendedor padrão'),
  ('default_contact_email', '', 'contact', 'Email para contato padrão'),
  ('default_contact_phone', '', 'contact', 'Telefone para contato padrão')
ON CONFLICT (key) DO NOTHING;

-- Configurações de serviços - Preços padrão
INSERT INTO form_settings (key, value, category, description) VALUES
  ('service_sat_price', '', 'services', 'Preço padrão do SAT'),
  ('service_sat_days', '3', 'services', 'Dias padrão do SAT'),
  ('service_fat_price', '', 'services', 'Preço padrão do FAT'),
  ('service_fat_days', '2', 'services', 'Dias padrão do FAT'),
  ('service_startup_price', '', 'services', 'Preço padrão do Startup'),
  ('service_startup_days', '3', 'services', 'Dias padrão do Startup'),
  ('service_acompanhamento_price', '', 'services', 'Preço padrão do Acompanhamento'),
  ('service_acompanhamento_days', '5', 'services', 'Dias padrão do Acompanhamento'),
  ('service_manutencao_price', '', 'services', 'Preço padrão da Manutenção'),
  ('service_manutencao_days', '3', 'services', 'Dias padrão da Manutenção')
ON CONFLICT (key) DO NOTHING;

-- Itens de serviços padrão (separados por vírgula)
INSERT INTO form_settings (key, value, category, description) VALUES
  ('default_service_items', 'SAT,FAT,Startup', 'services', 'Itens de serviços padrão (separados por vírgula)')
ON CONFLICT (key) DO NOTHING;

-- Configurações de numeração de propostas
INSERT INTO form_settings (key, value, category, description) VALUES
  ('quote_number_type', 'date', 'quote', 'Tipo de numeração: date (por data) ou sequential (sequencial)'),
  ('quote_number_prefix', '', 'quote', 'Prefixo para número da proposta (opcional)'),
  ('quote_number_counter', '1', 'quote', 'Contador sequencial para propostas')
ON CONFLICT (key) DO NOTHING;
