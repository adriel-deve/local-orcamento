/**
 * Serviço de Cálculo de Serviços
 * Calcula valores de serviços baseado no valor FOB dos equipamentos
 */

import { getSettingsAsObject } from './settings-service.js';

/**
 * Calcula todos os valores de serviços baseado no valor FOB
 * Fórmula: FOB × 60% = Valor de Serviços
 * Depois aplica os percentuais de cada serviço
 *
 * @param {number} valorFOB - Valor FOB total dos equipamentos
 * @returns {Object} Objeto com todos os valores calculados
 */
export async function calcularServicos(valorFOB) {
  const settings = await getSettingsAsObject();

  // Converter para número e garantir que é válido
  const fob = parseFloat(valorFOB) || 0;

  // 1. PERCENTUAL BASE - Valor total de serviços (padrão 60% do FOB)
  const percentualBase = parseFloat(settings.service_base_percent || 60) / 100;
  const valorServicos = fob * percentualBase;

  // 2. PERCENTUAIS INDIVIDUAIS DOS SERVIÇOS
  const percentualNRs = parseFloat(settings.service_nrs_percent || 45) / 100;
  const percentualSAT = parseFloat(settings.service_sat_percent || 26) / 100;
  const percentualGarantia = parseFloat(settings.service_garantia_percent || 13) / 100;
  const percentualPreventiva = parseFloat(settings.service_preventiva_percent || 16) / 100;

  // 3. CÁLCULO DOS VALORES
  const valorNRs = valorServicos * percentualNRs;
  const valorSAT = valorServicos * percentualSAT;
  const valorGarantia = valorServicos * percentualGarantia;
  const valorPreventiva = valorServicos * percentualPreventiva;

  // Total de serviços (soma de todos)
  const totalServicos = valorNRs + valorSAT + valorGarantia + valorPreventiva;

  // 4. TEXTOS PADRÃO
  const textos = {
    nrs: settings.service_nrs_text || 'Adaptações para as Normas NR 10, NR 12, com Laudo técnico e ART.',
    sat: settings.service_sat_text || 'SAT (Startup feito por engenheiros Zanatec, e suporte de qualificação IQ/OQ e treinamento operacional ). Incluindo despesas.',
    garantia: settings.service_garantia_text || 'Garantia Nacional Extendida (12 meses) - Suporte técnico remoto ilimitado - Até 03 visitas técnicas emergenciais (sem custo de honorários, limitado a 05 dias úteis por visita) Relatório diagnóstico e recomendações',
    preventiva: settings.service_preventiva_text || 'Plano de Manutenção Preventiva (12 meses) - 04 visitas programadas (trimestral) - Checklist completo de verificação - Validação de calibragem e ajustes Relatórios detalhados de condições e recomendações'
  };

  return {
    // Valores base
    valorFOB: fob,
    percentualBase: percentualBase * 100,
    valorServicos,

    // Serviços individuais
    servicos: {
      NRs: {
        percentual: percentualNRs * 100,
        valor: valorNRs,
        texto: textos.nrs
      },
      SAT: {
        percentual: percentualSAT * 100,
        valor: valorSAT,
        texto: textos.sat
      },
      Garantia: {
        percentual: percentualGarantia * 100,
        valor: valorGarantia,
        texto: textos.garantia
      },
      Preventiva: {
        percentual: percentualPreventiva * 100,
        valor: valorPreventiva,
        texto: textos.preventiva
      }
    },

    // Total
    totalServicos,

    // Textos padrão
    textos,

    // Itens formatados para adicionar no formulário
    // Vão para "Serviços Operacionais e Preventivos"
    itensParaFormulario: [
      // 1. NRs (Normas Regulamentadoras)
      {
        section: 'sec_operacionais_a',
        name: textos.nrs,
        qty: 1,
        unit: Math.round(valorNRs * 100) / 100,
        currency: 'BRL'
      },
      // 2. SAT (Startup e Treinamento)
      {
        section: 'sec_operacionais_a',
        name: textos.sat,
        qty: 1,
        unit: Math.round(valorSAT * 100) / 100,
        currency: 'BRL'
      },
      // 3. Garantia Extendida
      {
        section: 'sec_operacionais_a',
        name: textos.garantia,
        qty: 1,
        unit: Math.round(valorGarantia * 100) / 100,
        currency: 'BRL'
      },
      // 4. Manutenção Preventiva
      {
        section: 'sec_operacionais_a',
        name: textos.preventiva,
        qty: 1,
        unit: Math.round(valorPreventiva * 100) / 100,
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
 * @param {Object} calculo - Resultado do calcularServicos
 * @returns {string} Resumo formatado
 */
export function criarResumoCalculo(calculo) {
  return `
📊 RESUMO DO CÁLCULO DE SERVIÇOS

💵 Valor FOB Total: R$ ${formatarMoeda(calculo.valorFOB)}
⚙️ Percentual Base: ${calculo.percentualBase.toFixed(2)}%
💰 Valor Total de Serviços: R$ ${formatarMoeda(calculo.valorServicos)}

📋 SERVIÇOS CALCULADOS:

📋 NRs (${calculo.servicos.NRs.percentual.toFixed(2)}%): R$ ${formatarMoeda(calculo.servicos.NRs.valor)}
   ${calculo.servicos.NRs.texto}

🚀 SAT (${calculo.servicos.SAT.percentual.toFixed(2)}%): R$ ${formatarMoeda(calculo.servicos.SAT.valor)}
   ${calculo.servicos.SAT.texto}

🛡️ Garantia Extendida (${calculo.servicos.Garantia.percentual.toFixed(2)}%): R$ ${formatarMoeda(calculo.servicos.Garantia.valor)}
   ${calculo.servicos.Garantia.texto}

🔧 Manutenção Preventiva (${calculo.servicos.Preventiva.percentual.toFixed(2)}%): R$ ${formatarMoeda(calculo.servicos.Preventiva.valor)}
   ${calculo.servicos.Preventiva.texto}

✅ TOTAL DE SERVIÇOS: R$ ${formatarMoeda(calculo.totalServicos)}
  `.trim();
}

export default {
  calcularServicos,
  formatarMoeda,
  criarResumoCalculo
};
