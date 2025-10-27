-- ============================================
-- CRIAR TABELA DE CONFIGURAÇÕES (form_settings)
-- COPIE TODO ESTE ARQUIVO E COLE NO CONSOLE SQL DO NEON
-- ============================================

-- 1. Criar tabela form_settings
CREATE TABLE IF NOT EXISTS form_settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_form_settings_category ON form_settings(category);
CREATE INDEX IF NOT EXISTS idx_form_settings_key ON form_settings(key);

-- 3. Trigger para updated_at automático
DROP TRIGGER IF EXISTS update_form_settings_updated_at ON form_settings;
CREATE TRIGGER update_form_settings_updated_at BEFORE UPDATE
    ON form_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Inserir configurações de cálculo de serviços

-- Percentual base sobre FOB (60%)
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_base_percent', '60.00', 'Percentual base sobre FOB para calcular valor total de serviços (%)')
ON CONFLICT (key) DO NOTHING;

-- NRs (Normas Regulamentadoras) - 45% dos serviços
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_nrs_percent', '45.00', 'Percentual de NRs sobre valor de serviços (%)'),
('service_calc', 'service_nrs_text', 'Adaptações para as Normas NR 10, NR 12, com Laudo técnico e ART.', 'Texto padrão para serviço de NRs')
ON CONFLICT (key) DO NOTHING;

-- SAT (Startup e Treinamento) - 26% dos serviços
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_sat_percent', '26.00', 'Percentual de SAT sobre valor de serviços (%)'),
('service_calc', 'service_sat_text', 'SAT (Startup feito por engenheiros Zanatec, e suporte de qualificação IQ/OQ e treinamento operacional ). Incluindo despesas.', 'Texto padrão para serviço de SAT')
ON CONFLICT (key) DO NOTHING;

-- Garantia Extendida - 13% dos serviços
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_garantia_percent', '13.00', 'Percentual de Garantia Extendida sobre valor de serviços (%)'),
('service_calc', 'service_garantia_text', 'Garantia Nacional Extendida (12 meses) - Suporte técnico remoto ilimitado - Até 03 visitas técnicas emergenciais (sem custo de honorários, limitado a 05 dias úteis por visita) Relatório diagnóstico e recomendações', 'Texto padrão para Garantia Extendida')
ON CONFLICT (key) DO NOTHING;

-- Manutenção Preventiva - 16% dos serviços
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_preventiva_percent', '16.00', 'Percentual de Manutenção Preventiva sobre valor de serviços (%)'),
('service_calc', 'service_preventiva_text', 'Plano de Manutenção Preventiva (12 meses) - 04 visitas programadas (trimestral) - Checklist completo de verificação - Validação de calibragem e ajustes Relatórios detalhados de condições e recomendações', 'Texto padrão para Manutenção Preventiva')
ON CONFLICT (key) DO NOTHING;

-- 5. Inserir configurações de importação (impostos)
INSERT INTO form_settings (category, key, value, description) VALUES
('import', 'import_tax_ii', '11.20', 'Imposto de Importação (II) - Alíquota %'),
('import', 'import_tax_ipi', '2.29', 'IPI - Alíquota %'),
('import', 'import_tax_pis', '2.10', 'PIS/PASEP - Alíquota %'),
('import', 'import_tax_cofins', '6.81', 'COFINS - Alíquota %'),
('import', 'import_tax_icms', '18.23', 'ICMS - Alíquota %'),
('import', 'import_tax_afrmm', '8.00', 'AFRMM - Alíquota %'),
('import', 'import_tax_siscomex', '0.00', 'SISCOMEX - Alíquota %')
ON CONFLICT (key) DO NOTHING;

-- 6. Inserir configurações de importação (despesas fixas)
INSERT INTO form_settings (category, key, value, description) VALUES
('import', 'import_fee_siscomex_fixed', '185.00', 'SISCOMEX - Taxa Fixa (R$)'),
('import', 'import_fee_despachante', '1812.00', 'Honorários de Despachante (R$)'),
('import', 'import_fee_honorario_radar', '3000.00', 'Honorário Radar (R$)'),
('import', 'import_fee_armazenagem_porto', '1350.00', 'Armazenagem Porto (R$)'),
('import', 'import_fee_despesas_porto', '1300.00', 'Despesas Porto (R$)'),
('import', 'import_fee_licenca_anvisa', '170.00', 'Licença ANVISA (R$)'),
('import', 'import_fee_liberacao_bl', '1500.00', 'Liberação da BL (R$)'),
('import', 'import_fee_licenca_importacao', '170.00', 'Licença de Importação (R$)'),
('import', 'import_fee_frete_rodoviario', '5000.00', 'Frete Rodoviário (R$)')
ON CONFLICT (key) DO NOTHING;

-- 7. Inserir configurações de consultoria
INSERT INTO form_settings (category, key, value, description) VALUES
('import', 'import_consultoria_percent', '10.00', 'Consultoria - Percentual sobre equipamento (%)'),
('import', 'import_consultoria_desconto_garantia', '10.00', 'Desconto Garantia - Percentual (%)'),
('import', 'import_consultoria_desconto_manutencao', '8.33', 'Desconto Plano Manutenção - Percentual (%)')
ON CONFLICT (key) DO NOTHING;

-- 8. Inserir textos padrão
INSERT INTO form_settings (category, key, value, description) VALUES
('import', 'import_text_consultoria', 'Consultoria com acompanhamento e suporte até o recebimento', 'Texto padrão: Consultoria'),
('import', 'import_text_honorarios', 'Honorários de despachantes e manuseio', 'Texto padrão: Honorários'),
('import', 'import_text_importacao', 'Despesas de importação', 'Texto padrão: Despesas de Importação'),
('import', 'import_text_transporte', 'Transporte até a porta da empresa', 'Texto padrão: Transporte')
ON CONFLICT (key) DO NOTHING;

-- Verificação final
SELECT 'Tabela form_settings criada e configurações inseridas com sucesso!' AS status;
SELECT COUNT(*) as total_settings FROM form_settings;
