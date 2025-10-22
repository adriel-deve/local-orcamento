-- Adicionar configurações de cálculos de importação
-- Impostos em % (percentual)
INSERT INTO form_settings (category, key, value, description) VALUES
('import', 'import_tax_ii', '11.20', 'Imposto de Importação (II) - Alíquota %'),
('import', 'import_tax_ipi', '2.29', 'IPI - Alíquota %'),
('import', 'import_tax_pis', '2.10', 'PIS/PASEP - Alíquota %'),
('import', 'import_tax_cofins', '6.81', 'COFINS - Alíquota %'),
('import', 'import_tax_icms', '18.23', 'ICMS - Alíquota %'),
('import', 'import_tax_afrmm', '8.00', 'AFRMM - Alíquota %'),
('import', 'import_tax_siscomex', '0.00', 'SISCOMEX - Alíquota %')
ON CONFLICT (key) DO NOTHING;

-- Despesas fixas em BRL
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

-- Consultoria proporcional
INSERT INTO form_settings (category, key, value, description) VALUES
('import', 'import_consultoria_percent', '10.00', 'Consultoria - Percentual sobre equipamento (%)'),
('import', 'import_consultoria_desconto_garantia', '10.00', 'Desconto Garantia - Percentual (%)'),
('import', 'import_consultoria_desconto_manutencao', '8.33', 'Desconto Plano Manutenção - Percentual (%)')
ON CONFLICT (key) DO NOTHING;

-- Textos padrão dos itens
INSERT INTO form_settings (category, key, value, description) VALUES
('import', 'import_text_consultoria', 'Consultoria com acompanhamento e suporte até o recebimento', 'Texto padrão: Consultoria'),
('import', 'import_text_honorarios', 'Honorários de despachantes e manuseio', 'Texto padrão: Honorários'),
('import', 'import_text_importacao', 'Despesas de importação', 'Texto padrão: Despesas de Importação'),
('import', 'import_text_transporte', 'Transporte até a porta da empresa', 'Texto padrão: Transporte')
ON CONFLICT (key) DO NOTHING;
