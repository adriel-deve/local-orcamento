import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const SECTION_CATALOG = [
  { key: 'equipamentos_a', label: 'EQUIPAMENTOS_A', title: 'Modalidade A - Equipamentos (CIF)' },
  { key: 'assessoria_a', label: 'ASSESSORIA_A', title: 'Modalidade A - Servicos de Assessoria (CIF)' },
  { key: 'operacionais_a', label: 'OPERACIONAIS_A', title: 'Modalidade A - Servicos Operacionais (CIF)' },
  { key: 'certificados_a', label: 'CERTIFICADOS_A', title: 'Modalidade A - Certificados (CIF)' },
  { key: 'equipamentos_b', label: 'EQUIPAMENTOS_B', title: 'Modalidade B - Equipamentos (FOB)' },
  { key: 'assessoria_b', label: 'ASSESSORIA_B', title: 'Modalidade B - Servicos de Assessoria (FOB)' },
  { key: 'operacionais_b', label: 'OPERACIONAIS_B', title: 'Modalidade B - Servicos Operacionais (FOB)' },
  { key: 'certificados_b', label: 'CERTIFICADOS_B', title: 'Modalidade B - Certificados (FOB)' }
];

const BASE_CURRENCIES = ['BRL', 'USD', 'EUR'];

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function currencySymbol(cur) {
  const upper = String(cur || 'BRL').toUpperCase();
  return upper === 'USD' ? '$' : (upper === 'EUR' ? '€' : 'R$');
}

function fmt(val) {
  return Number(val || 0).toFixed(2).replace('.', ',');
}

function cloneSection(section) {
  const key = section.key || '';
  const title = section.title || '';
  const items = (section.items || []).map(item => {
    const qty = toNumber(item.qty ?? item.quantity ?? 1, 1);
    const unit = toNumber(item.unit ?? item.unit_price ?? item.price ?? 0, 0);
    const currency = String(item.currency || 'BRL').toUpperCase();
    const subtotal = item.subtotal != null ? toNumber(item.subtotal, qty * unit) : qty * unit;
    const days = item.days ?? item.dias ?? item.duration ?? null;
    const normalized = {
      name: item.name || item.description || '',
      qty,
      unit,
      currency,
      subtotal
    };
    if (days !== null && days !== '' && days !== undefined) {
      normalized.days = days;
    }
    return normalized;
  });
  return { key, title, items };
}

function computeTotals(sections = [], usedCurrencies = new Set()) {
  const totals = {
    modalidadeA: { BRL: 0, USD: 0, EUR: 0 },
    modalidadeB: { BRL: 0, USD: 0, EUR: 0 },
    general: { BRL: 0, USD: 0, EUR: 0 },
    usedCurrencies: []
  };

  sections.forEach(section => {
    (section.items || []).forEach(item => {
      const currency = item.currency || 'BRL';
      const subtotal = toNumber(item.subtotal, 0);
      usedCurrencies.add(currency);

      if (!totals.general[currency]) totals.general[currency] = 0;
      totals.general[currency] += subtotal;

      if (section.key.includes('_a')) {
        if (!totals.modalidadeA[currency]) totals.modalidadeA[currency] = 0;
        totals.modalidadeA[currency] += subtotal;
      } else if (section.key.includes('_b')) {
        if (!totals.modalidadeB[currency]) totals.modalidadeB[currency] = 0;
        totals.modalidadeB[currency] += subtotal;
      }
    });
  });

  BASE_CURRENCIES.forEach(currency => {
    totals.modalidadeA[currency] = totals.modalidadeA[currency] || 0;
    totals.modalidadeB[currency] = totals.modalidadeB[currency] || 0;
    totals.general[currency] = totals.general[currency] || 0;
  });

  totals.usedCurrencies = Array.from(usedCurrencies);
  return totals;
}

function deriveSectionsFromSpecs(specs = []) {
  const map = new Map(
    SECTION_CATALOG.map(def => [def.key, { key: def.key, title: def.title, items: [] }])
  );
  const usedCurrencies = new Set();

  specs.forEach(section => {
    const label = String(section.description || '').toUpperCase();
    const def = SECTION_CATALOG.find(entry => label.includes(entry.label));
    if (!def) return;
    const target = map.get(def.key);

    (section.items || []).forEach(item => {
      const qty = toNumber(item.qty ?? item.quantity ?? 1, 1);
      const unit = toNumber(item.unit ?? item.unit_price ?? item.price ?? 0, 0);
      const currency = String(item.currency || 'BRL').toUpperCase();
      const subtotal = qty * unit;
      const days = item.days ?? item.dias ?? item.duration ?? null;
      const normalized = {
        name: item.name || item.description || '',
        qty,
        unit,
        currency,
        subtotal
      };
      if (days !== null && days !== '' && days !== undefined) {
        normalized.days = days;
      }
      target.items.push(normalized);
      usedCurrencies.add(currency);
    });
  });

  const sections = Array.from(map.values());
  const totals = computeTotals(sections, usedCurrencies);
  return { sections, totals };
}

function normalizeSections(sections = []) {
  const cloned = (sections || []).map(cloneSection);
  const usedCurrencies = new Set();
  cloned.forEach(section => {
    section.items.forEach(item => usedCurrencies.add(item.currency));
  });
  const totals = computeTotals(cloned, usedCurrencies);
  return { sections: cloned, totals };
}

function ensureSafeFilename(value) {
  if (!value) return `Proposta-${Date.now()}.pdf`;
  return `${String(value).replace(/[^a-zA-Z0-9-_]+/g, '_')}.pdf`;
}

export async function generatePdfFromData({
  quote,
  specs = [],
  sections: rawSections,
  totals: rawTotals,
  writeToDisk = true,
  outputDir,
  filename
}) {
  if (!quote) {
    throw new Error('generatePdfFromData: quote e obrigatorio.');
  }

  let sections;
  let totals;

  if (rawSections && rawSections.length) {
    const normalized = normalizeSections(rawSections);
    sections = normalized.sections;
    totals = rawTotals || normalized.totals;
  } else {
    const computed = deriveSectionsFromSpecs(specs);
    sections = computed.sections;
    totals = rawTotals || computed.totals;
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);

      let outPath = null;
      if (writeToDisk) {
        try {
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          const projectRoot = path.join(__dirname, '..', '..');
          const baseDir = outputDir
            ? outputDir
            : (process.env.NODE_ENV === 'production'
              ? path.join(os.tmpdir(), 'local-orcamentos', 'output')
              : path.join(projectRoot, 'output'));
          fs.mkdirSync(baseDir, { recursive: true });
          const safeName = ensureSafeFilename(filename || quote.quote_code || 'proposta');
          outPath = path.join(baseDir, safeName);
          fs.writeFileSync(outPath, pdfBuffer);
        } catch (error) {
          console.error('Error writing PDF to disk:', error);
        }
      }

      resolve({ buffer: pdfBuffer, outPath, sections, totals });
    });

    doc.on('error', reject);

    try {
      // Header - Cover Page
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#1f2937')
         .text(`Proposta Comercial ${quote.quote_code || ''}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(14)
         .text(`Modelo: ${quote.machine_model || '-'}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(10).fillColor('#4b5563');
      doc.text(`Cliente: ${quote.client || quote.company || '-'}`);
      doc.text(`CNPJ: ${quote.cnpj || '-'}`);
      doc.text(`Representante: ${quote.representative || '-'}`);
      doc.text(`Fornecedor: ${quote.supplier || '-'}`);
      doc.text(`Validade: ${quote.validity_days || 0} dias`);
      doc.text(`Prazo de entrega: ${quote.delivery_time || '-'}`);

      doc.addPage();

      // Technical Specifications
      if (quote.principle) {
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937')
           .text('Principio de funcionamento', { underline: true });
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(10).fillColor('#111827')
           .text(quote.principle || '-', { align: 'left' });
        doc.moveDown(1);
      }

      if (quote.tech_spec) {
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937')
           .text('Especificacao tecnica', { underline: true });
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(10).fillColor('#111827')
           .text(quote.tech_spec || '-', { align: 'left' });
        doc.moveDown(1);
      }

      doc.addPage();

      // Financial Details
      sections.forEach(section => {
        if (section.items && section.items.length > 0) {
          doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937')
             .text(section.title, { underline: true });
          doc.moveDown(0.4);

          const sectionTotals = { BRL: 0, USD: 0, EUR: 0 };

          section.items.forEach(item => {
            if (doc.y > 700) doc.addPage();

            doc.font('Helvetica').fontSize(10).fillColor('#111827');
            doc.text(`${item.name}`, { continued: false });
            doc.text(`  Qtd: ${item.qty} | Unitario: ${currencySymbol(item.currency)} ${fmt(item.unit)} | Subtotal: ${currencySymbol(item.currency)} ${fmt(item.subtotal)}`);
            doc.moveDown(0.3);

            sectionTotals[item.currency] = (sectionTotals[item.currency] || 0) + item.subtotal;
          });

          doc.moveDown(0.4);
          const parts = [];
          if (sectionTotals.BRL) parts.push('R$ ' + fmt(sectionTotals.BRL));
          if (sectionTotals.USD) parts.push('$ ' + fmt(sectionTotals.USD));
          if (sectionTotals.EUR) parts.push('€ ' + fmt(sectionTotals.EUR));
          doc.font('Helvetica-Bold').text('Total do bloco: ' + (parts.join(' | ') || 'R$ 0,00'));
          doc.moveDown(1);
        }
      });

      // Global Totals
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(12).text('Totais consolidados:');
      const globalParts = [];
      if (totals.general.BRL) globalParts.push('R$ ' + fmt(totals.general.BRL));
      if (totals.general.USD) globalParts.push('$ ' + fmt(totals.general.USD));
      if (totals.general.EUR) globalParts.push('€ ' + fmt(totals.general.EUR));
      doc.font('Helvetica').text(globalParts.join(' | ') || 'R$ 0,00');

      // Payment Conditions
      if (quote.include_payment_conditions) {
        doc.addPage();
        doc.font('Helvetica-Bold').fontSize(14).text('Condicoes de Pagamento');
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10);
        if (quote.payment_intro) {
          doc.text(quote.payment_intro);
          doc.moveDown(0.5);
        }
        if (quote.payment_usd_conditions) {
          doc.text('USD: ' + quote.payment_usd_conditions);
          doc.moveDown(0.3);
        }
        if (quote.payment_brl_intro) {
          doc.text(quote.payment_brl_intro);
          doc.moveDown(0.3);
        }
      }

      doc.end();
    } catch (error) {
      doc.end();
      reject(error);
    }
  });
}
