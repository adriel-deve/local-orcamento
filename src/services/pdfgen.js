import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import PDFDocument from 'pdfkit';

function currencySymbol(cur) {
  const upper = String(cur || 'BRL').toUpperCase();
  return upper === 'USD' ? '$' : (upper === 'EUR' ? '€' : 'R$');
}

function normalizeItem(item, sectionName) {
  const qty = Number(item.qty || 1);
  const unit = Number(item.unit || item.price || 0);
  const currency = String(item.currency || 'BRL').toUpperCase();
  const subtotal = qty * unit;
  return { name: item.name || '', qty, unit, currency, subtotal, section: sectionName };
}

function categorize(specs) {
  const sections = [
    { key: 'equip', title: 'Equipamentos', items: [] },
    { key: 'assessoria', title: 'Serviços de assessoria na importação', items: [] },
    { key: 'operacionais', title: 'Serviços operacionais e preventivos', items: [] },
    { key: 'certificados', title: 'Certificados', items: [] }
  ];
  const map = {
    EQUIP: sections[0],
    ASSESS: sections[1],
    OPERACION: sections[2],
    CERTIFIC: sections[3]
  };
  (specs || []).forEach(section => {
    const label = (section.description || '').toUpperCase();
    const bucket = label.includes('CERTIFIC') ? map.CERTIFIC : (label.includes('OPERACION') ? map.OPERACION : (label.includes('ASSESS') ? map.ASSESS : map.EQUIP));
    (section.items || []).forEach(item => bucket.items.push(normalizeItem(item, section.description || '')));
  });
  return sections;
}

function sumTotals(items) {
  const totals = { BRL: 0, USD: 0, EUR: 0 };
  (items || []).forEach(it => {
    totals[it.currency] = (totals[it.currency] || 0) + it.subtotal;
  });
  return totals;
}

export async function generatePdfFromData({ quote, specs }) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const baseDir = process.env.NODE_ENV === 'production'
    ? path.join(os.tmpdir(), 'local-orcamentos')
    : path.join(__dirname, '..', '..');
  const outDir = path.join(baseDir, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${quote.quote_code}.pdf`);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  const sections = categorize(specs);
  const globalTotals = { BRL: 0, USD: 0, EUR: 0 };

  function fmt(val){ return Number(val || 0).toFixed(2).replace('.', ','); }
  // Capa
  doc.font('Helvetica-Bold').fontSize(22).fillColor('#1f2937').text(`Proposta Comercial ${quote.quote_code || ''}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(14).text(`Modelo: ${quote.machine_model || '-'}`, { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(10).fillColor('#4b5563');
  doc.text(`Cliente: ${quote.client || quote.company || '-'}`);
  doc.text(`CNPJ: ${quote.cnpj || '-'}`);
  doc.text(`Representante: ${quote.representative || '-'}`);
  doc.text(`Fornecedor: ${quote.supplier || '-'}`);
  doc.text(`Validade: ${quote.validity_days || 0} dias`);
  doc.text(`Prazo de entrega: ${quote.delivery_time || '-'}`);
  doc.addPage();

  // Página técnica
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937').text('Princípio de funcionamento', { underline: true });
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10).fillColor('#111827').text(quote.principle || '-', { align: 'left' });
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937').text('Especificação técnica', { underline: true });
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10).fillColor('#111827').text(quote.tech_spec || '-', { align: 'left' });
  doc.addPage();

  // Detalhamento financeiro
  sections.forEach(section => {
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937').text(section.title, { underline: true });
    doc.moveDown(0.4);
    if (!section.items.length) {
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#6b7280').text('Nenhum item cadastrado.');
    } else {
      const startY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Descrição', { continued: true, width: 220 });
      doc.text('Qtd', { continued: true, width: 40 });
      doc.text('Unitário', { continued: true, width: 70 });
      doc.text('Moeda', { continued: true, width: 50 });
      doc.text('Subtotal');
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(10);
      section.items.forEach(item => {
        if (doc.y > 780) { doc.addPage(); }
        doc.text(item.name, { continued: true, width: 220 });
        doc.text(String(item.qty), { continued: true, width: 40 });
        doc.text(`${currencySymbol(item.currency)} ${fmt(item.unit)}`, { continued: true, width: 70 });
        doc.text(item.currency, { continued: true, width: 50 });
        doc.text(`${currencySymbol(item.currency)} ${fmt(item.subtotal)}`);
      });
      const totals = sumTotals(section.items);
      globalTotals.BRL += totals.BRL;
      globalTotals.USD += totals.USD;
      globalTotals.EUR += totals.EUR;
      doc.moveDown(0.4);
      const parts = [];
      if (totals.BRL) parts.push('R$ ' + fmt(totals.BRL));
      if (totals.USD) parts.push('$ ' + fmt(totals.USD));
      if (totals.EUR) parts.push('€ ' + fmt(totals.EUR));
      doc.font('Helvetica-Bold').text('Total do bloco: ' + (parts.join(' | ') || 'R$ 0,00'));
      doc.moveDown(1);
    }
  });

  const globalParts = [];
  if (globalTotals.BRL) globalParts.push('R$ ' + fmt(globalTotals.BRL));
  if (globalTotals.USD) globalParts.push('$ ' + fmt(globalTotals.USD));
  if (globalTotals.EUR) globalParts.push('€ ' + fmt(globalTotals.EUR));
  const combos = [];
  if (globalTotals.BRL && globalTotals.USD) combos.push('R$ ' + fmt(globalTotals.BRL) + ' + $ ' + fmt(globalTotals.USD));
  if (globalTotals.BRL && globalTotals.EUR) combos.push('R$ ' + fmt(globalTotals.BRL) + ' + € ' + fmt(globalTotals.EUR));
  if (!combos.length) {
    if (globalTotals.BRL) combos.push('R$ ' + fmt(globalTotals.BRL));
    else if (globalTotals.USD) combos.push('$ ' + fmt(globalTotals.USD));
    else if (globalTotals.EUR) combos.push('€ ' + fmt(globalTotals.EUR));
    else combos.push('R$ 0,00');
  }

  doc.font('Helvetica-Bold').fontSize(12).text('Totais consolidados:');
  doc.font('Helvetica').text(globalParts.join(' | ') || 'R$ 0,00');
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').text('Combinações:');
  doc.font('Helvetica').text(combos.join(' | '));

  doc.end();
  await new Promise(resolve => stream.on('finish', resolve));
  return outPath;
}
