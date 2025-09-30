import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import puppeteer from 'puppeteer';

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

function cloneSection(section) {
  const key = section.key || '';
  const title = section.title || '';
  const items = (section.items || []).map(item => {
    const qty = toNumber(item.qty ?? item.quantity ?? 1, 1);
    const unit = toNumber(item.unit ?? item.unit_price ?? item.price ?? 0, 0);
    const currency = String(item.currency || 'BRL').toUpperCase();
    const subtotal = item.subtotal != null ? toNumber(item.subtotal, qty * unit) : qty * unit;
    const days = item.days ?? item.dias ?? item.duration ?? null;
    const base = {
      name: item.name || item.description || '',
      qty,
      unit,
      currency,
      subtotal
    };
    if (days !== null && days !== '' && days !== undefined) {
      base.days = days;
    }
    return base;
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

async function renderHtml({ quote, sections, totals, templatePath }) {
  return ejs.renderFile(
    templatePath,
    { quote, sections, totals, isPdfRender: true },
    { async: true }
  );
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

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.join(__dirname, '..', '..');
  const templatePath = path.join(projectRoot, 'views', 'quotes', 'layout-print.ejs');

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

  const html = await renderHtml({ quote, sections, totals, templatePath });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  let pdfBuffer;
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' }
    });
  } finally {
    await browser.close();
  }

  let outPath = null;
  if (writeToDisk) {
    const baseDir = outputDir
      ? outputDir
      : (process.env.NODE_ENV === 'production'
        ? path.join(os.tmpdir(), 'local-orcamentos', 'output')
        : path.join(projectRoot, 'output'));
    fs.mkdirSync(baseDir, { recursive: true });
    const safeName = ensureSafeFilename(filename || quote.quote_code || 'proposta');
    outPath = path.join(baseDir, safeName);
    fs.writeFileSync(outPath, pdfBuffer);
  }

  return { buffer: pdfBuffer, outPath, sections, totals };
}
