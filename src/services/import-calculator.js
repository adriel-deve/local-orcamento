/**
 * Serviço de Cálculo de Importação
 * Calcula impostos e despesas de importação baseado nas configurações
 */

import { getSettingsAsObject } from './settings-service.js';

/**
 * Calcula todos os valores de importação baseado no valor FOB do equipamento
 * @param {number} valorFOB - Valor FOB do equipamento em USD
 * @param {number} taxaCambio - Taxa de câmbio USD para BRL
 * @returns {Object} Objeto com todos os valores calculados
 */
export async function calcularImportacao(valorFOB, taxaCambio = 5.70) {
  const settings = await getSettingsAsObject();

  // Converter para número e garantir que são válidos
  const fob = parseFloat(valorFOB) || 0;
  const cambio = parseFloat(taxaCambio) || 5.70;

  // Valor FOB em BRL
  const valorFOBBRL = fob * cambio;

  // 1. IMPOSTOS (Percentuais sobre FOB)
  const taxaII = parseFloat(settings.import_tax_ii || 0) / 100;
  const taxaIPI = parseFloat(settings.import_tax_ipi || 0) / 100;
  const taxaPIS = parseFloat(settings.import_tax_pis || 0) / 100;
  const taxaCOFINS = parseFloat(settings.import_tax_cofins || 0) / 100;
  const taxaICMS = parseFloat(settings.import_tax_icms || 0) / 100;
  const taxaAFRMM = parseFloat(settings.import_tax_afrmm || 0) / 100;
  const taxaSISCOMEX = parseFloat(settings.import_tax_siscomex || 0) / 100;

  // Cálculo dos impostos
  const impostoII = valorFOBBRL * taxaII;
  const impostoIPI = valorFOBBRL * taxaIPI;
  const impostoPIS = valorFOBBRL * taxaPIS;
  const impostoCOFINS = valorFOBBRL * taxaCOFINS;
  const impostoICMS = valorFOBBRL * taxaICMS;
  const impostoAFRMM = valorFOBBRL * taxaAFRMM;
  const impostoSISCOMEXPerc = valorFOBBRL * taxaSISCOMEX;

  // 2. DESPESAS FIXAS
  const siscomexFixo = parseFloat(settings.import_fee_siscomex_fixed || 0);
  const despachante = parseFloat(settings.import_fee_despachante || 0);
  const honorarioRadar = parseFloat(settings.import_fee_honorario_radar || 0);
  const armazenagemPorto = parseFloat(settings.import_fee_armazenagem_porto || 0);
  const despesasPorto = parseFloat(settings.import_fee_despesas_porto || 0);
  const licencaANVISA = parseFloat(settings.import_fee_licenca_anvisa || 0);
  const liberacaoBL = parseFloat(settings.import_fee_liberacao_bl || 0);
  const licencaImportacao = parseFloat(settings.import_fee_licenca_importacao || 0);
  const freteRodoviario = parseFloat(settings.import_fee_frete_rodoviario || 0);

  // Total de despesas fixas
  const totalDespesasFixas = siscomexFixo + despachante + honorarioRadar +
                             armazenagemPorto + despesasPorto + licencaANVISA +
                             liberacaoBL + licencaImportacao;

  // Total de impostos
  const totalImpostos = impostoII + impostoIPI + impostoPIS + impostoCOFINS +
                        impostoICMS + impostoAFRMM + impostoSISCOMEXPerc;

  // 3. CONSULTORIA (Percentual sobre equipamento)
  const percentualConsultoria = parseFloat(settings.import_consultoria_percent || 0) / 100;
  const valorConsultoria = valorFOBBRL * percentualConsultoria;

  // Descontos
  const percentualDescontoGarantia = parseFloat(settings.import_consultoria_desconto_garantia || 0) / 100;
  const percentualDescontoManutencao = parseFloat(settings.import_consultoria_desconto_manutencao || 0) / 100;
  const descontoGarantia = valorFOBBRL * percentualDescontoGarantia;
  const descontoManutencao = valorFOBBRL * percentualDescontoManutencao;

  // 4. TOTAIS
  const totalDespesasImportacao = totalImpostos + totalDespesasFixas;
  const valorTotalCIF = valorFOBBRL + totalDespesasImportacao + freteRodoviario;

  // 5. TEXTOS PADRÃO
  const textos = {
    consultoria: settings.import_text_consultoria || 'Consultoria com acompanhamento e suporte até o recebimento',
    honorarios: settings.import_text_honorarios || 'Honorários de despachantes e manuseio',
    importacao: settings.import_text_importacao || 'Despesas de importação',
    transporte: settings.import_text_transporte || 'Transporte até a porta da empresa'
  };

  return {
    // Valores base
    valorFOB: fob,
    taxaCambio: cambio,
    valorFOBBRL,

    // Impostos individuais
    impostos: {
      II: { taxa: taxaII * 100, valor: impostoII },
      IPI: { taxa: taxaIPI * 100, valor: impostoIPI },
      PIS: { taxa: taxaPIS * 100, valor: impostoPIS },
      COFINS: { taxa: taxaCOFINS * 100, valor: impostoCOFINS },
      ICMS: { taxa: taxaICMS * 100, valor: impostoICMS },
      AFRMM: { taxa: taxaAFRMM * 100, valor: impostoAFRMM },
      SISCOMEX_PERC: { taxa: taxaSISCOMEX * 100, valor: impostoSISCOMEXPerc }
    },
    totalImpostos,

    // Despesas fixas individuais
    despesasFixas: {
      siscomexFixo,
      despachante,
      honorarioRadar,
      armazenagemPorto,
      despesasPorto,
      licencaANVISA,
      liberacaoBL,
      licencaImportacao,
      freteRodoviario
    },
    totalDespesasFixas,

    // Consultoria
    consultoria: {
      percentual: percentualConsultoria * 100,
      valor: valorConsultoria,
      descontoGarantia: { percentual: percentualDescontoGarantia * 100, valor: descontoGarantia },
      descontoManutencao: { percentual: percentualDescontoManutencao * 100, valor: descontoManutencao }
    },

    // Totais
    totalDespesasImportacao,
    freteRodoviario,
    valorTotalCIF,

    // Textos padrão
    textos,

    // Itens formatados para adicionar no formulário
    // APENAS os 4 itens principais vão para "Serviços de Assessoria na Importação"
    itensParaFormulario: [
      // 1. Consultoria
      {
        section: 'sec_assessoria_a',
        name: textos.consultoria || 'Consultoria com acompanhamento e suporte até o recebimento',
        qty: 1,
        unit: Math.round(valorConsultoria * 100) / 100,
        currency: 'BRL'
      },
      // 2. Honorários de despachantes
      {
        section: 'sec_assessoria_a',
        name: textos.honorarios || 'Honorários de despachantes e manuseio',
        qty: 1,
        unit: Math.round(despachante * 100) / 100,
        currency: 'BRL'
      },
      // 3. Despesas de importação (soma de TODOS os impostos + taxas fixas)
      {
        section: 'sec_assessoria_a',
        name: textos.importacao || 'Despesas de importação',
        qty: 1,
        unit: Math.round(totalDespesasImportacao * 100) / 100,
        currency: 'BRL'
      },
      // 4. Transporte rodoviário
      {
        section: 'sec_assessoria_a',
        name: textos.transporte || 'Transporte até a porta da empresa',
        qty: 1,
        unit: Math.round(freteRodoviario * 100) / 100,
        currency: 'BRL'
      }
    ]
  };
}

/**
 * Formata um valor numérico para exibição em moeda brasileira
 * @param {number} valor - Valor numérico
 * @returns {string} Valor formatado
 */
export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor || 0);
}

/**
 * Cria um resumo textual dos cálculos
 * @param {Object} calculo - Resultado do calcularImportacao
 * @returns {string} Resumo formatado
 */
export function criarResumoCalculo(calculo) {
  return `
📊 RESUMO DO CÁLCULO DE IMPORTAÇÃO

💵 Valor FOB: USD ${formatarMoeda(calculo.valorFOB)} (Taxa: R$ ${formatarMoeda(calculo.taxaCambio)})
💰 Valor FOB em BRL: R$ ${formatarMoeda(calculo.valorFOBBRL)}

📋 IMPOSTOS:
   - II (${calculo.impostos.II.taxa.toFixed(2)}%): R$ ${formatarMoeda(calculo.impostos.II.valor)}
   - IPI (${calculo.impostos.IPI.taxa.toFixed(2)}%): R$ ${formatarMoeda(calculo.impostos.IPI.valor)}
   - PIS (${calculo.impostos.PIS.taxa.toFixed(2)}%): R$ ${formatarMoeda(calculo.impostos.PIS.valor)}
   - COFINS (${calculo.impostos.COFINS.taxa.toFixed(2)}%): R$ ${formatarMoeda(calculo.impostos.COFINS.valor)}
   - ICMS (${calculo.impostos.ICMS.taxa.toFixed(2)}%): R$ ${formatarMoeda(calculo.impostos.ICMS.valor)}
   - AFRMM (${calculo.impostos.AFRMM.taxa.toFixed(2)}%): R$ ${formatarMoeda(calculo.impostos.AFRMM.valor)}
   TOTAL IMPOSTOS: R$ ${formatarMoeda(calculo.totalImpostos)}

💼 DESPESAS FIXAS:
   - SISCOMEX: R$ ${formatarMoeda(calculo.despesasFixas.siscomexFixo)}
   - Despachante: R$ ${formatarMoeda(calculo.despesasFixas.despachante)}
   - Honorário Radar: R$ ${formatarMoeda(calculo.despesasFixas.honorarioRadar)}
   - Armazenagem: R$ ${formatarMoeda(calculo.despesasFixas.armazenagemPorto)}
   - Despesas Porto: R$ ${formatarMoeda(calculo.despesasFixas.despesasPorto)}
   - Licenças: R$ ${formatarMoeda(calculo.despesasFixas.licencaANVISA + calculo.despesasFixas.licencaImportacao)}
   TOTAL DESPESAS: R$ ${formatarMoeda(calculo.totalDespesasFixas)}

👔 CONSULTORIA (${calculo.consultoria.percentual.toFixed(2)}%): R$ ${formatarMoeda(calculo.consultoria.valor)}

🚚 FRETE RODOVIÁRIO: R$ ${formatarMoeda(calculo.freteRodoviario)}

✅ VALOR TOTAL CIF: R$ ${formatarMoeda(calculo.valorTotalCIF)}
  `.trim();
}

export default {
  calcularImportacao,
  formatarMoeda,
  criarResumoCalculo
};
