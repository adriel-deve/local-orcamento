-- Migração: Configurações de Cálculo de Serviços
-- Adiciona configurações para cálculo automático de serviços baseado em FOB

-- Categoria: service_calc - Cálculo de Serviços

-- Percentual base sobre FOB (60%)
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_base_percent', '60.00', 'Percentual base sobre FOB para calcular valor total de serviços (%)');

-- NRs (Normas Regulamentadoras) - 45% dos serviços
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_nrs_percent', '45.00', 'Percentual de NRs sobre valor de serviços (%)'),
('service_calc', 'service_nrs_text', 'Adaptações para as Normas NR 10, NR 12, com Laudo técnico e ART.', 'Texto padrão para serviço de NRs');

-- SAT (Startup e Treinamento) - 26% dos serviços
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_sat_percent', '26.00', 'Percentual de SAT sobre valor de serviços (%)'),
('service_calc', 'service_sat_text', 'SAT (Startup feito por engenheiros Zanatec, e suporte de qualificação IQ/OQ e treinamento operacional ). Incluindo despesas.', 'Texto padrão para serviço de SAT');

-- Garantia Extendida - 13% dos serviços
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_garantia_percent', '13.00', 'Percentual de Garantia Extendida sobre valor de serviços (%)'),
('service_calc', 'service_garantia_text', 'Garantia Nacional Extendida (12 meses) - Suporte técnico remoto ilimitado - Até 03 visitas técnicas emergenciais (sem custo de honorários, limitado a 05 dias úteis por visita) Relatório diagnóstico e recomendações', 'Texto padrão para Garantia Extendida');

-- Manutenção Preventiva - 16% dos serviços
INSERT INTO form_settings (category, key, value, description) VALUES
('service_calc', 'service_preventiva_percent', '16.00', 'Percentual de Manutenção Preventiva sobre valor de serviços (%)'),
('service_calc', 'service_preventiva_text', 'Plano de Manutenção Preventiva (12 meses) - 04 visitas programadas (trimestral) - Checklist completo de verificação - Validação de calibragem e ajustes Relatórios detalhados de condições e recomendações', 'Texto padrão para Manutenção Preventiva');

-- Comentário de validação
COMMENT ON COLUMN form_settings.value IS 'Valor da configuração (percentuais ou textos)';
