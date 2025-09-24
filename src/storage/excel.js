import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(__dirname, '..', '..');
const filePath = path.join(baseDir, 'data', 'orcamentos.xlsx');
const legacyPath = path.join(process.cwd(), 'local-orcamentos', 'data', 'orcamentos.xlsx');

function ensureWorkbook() {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    // Migração de caminho antigo, se existir
    const legacyDir = path.dirname(legacyPath);
    if (fs.existsSync(legacyDir) && fs.existsSync(legacyPath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.copyFileSync(legacyPath, filePath);
      return;
    }
    const wb = XLSX.utils.book_new();
    const quotes = XLSX.utils.aoa_to_sheet([[
      'id','quote_code','date','company','representative','supplier','services','validity_days','delivery_time','notes','status','created_at','updated_at'
    ]]);
    const specs = XLSX.utils.aoa_to_sheet([[ 'id','quote_id','spec_index','description','image_path' ]]);
  const items = XLSX.utils.aoa_to_sheet([[ 'id','quote_id','spec_index','name','price','qty','currency','section' ]]);
    XLSX.utils.book_append_sheet(wb, quotes, 'quotes');
    XLSX.utils.book_append_sheet(wb, specs, 'specs');
    XLSX.utils.book_append_sheet(wb, items, 'items');
    XLSX.writeFile(wb, filePath);
  }
}

function loadWorkbook() {
  ensureWorkbook();
  return XLSX.readFile(filePath);
}

function saveWorkbook(wb) {
  XLSX.writeFile(wb, filePath);
}

function sheetToJson(wb, name) {
  const ws = wb.Sheets[name] || XLSX.utils.aoa_to_sheet([[]]);
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function writeRows(wb, name, rows) {
  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  wb.Sheets[name] = ws;
  if (!wb.SheetNames.includes(name)) wb.SheetNames.push(name);
}

export function initExcel() {
  ensureWorkbook();
}

export function getQuoteByCode(code) {
  const wb = loadWorkbook();
  const quotes = sheetToJson(wb, 'quotes');
  const specs = sheetToJson(wb, 'specs');
  const items = sheetToJson(wb, 'items');
  const q = quotes.find(r => String(r.quote_code).trim() === String(code).trim());
  if (!q) return null;
  const qSpecs = specs.filter(s => Number(s.quote_id) === Number(q.id))
    .sort((a,b)=>Number(a.spec_index)-Number(b.spec_index))
    .map(s => ({
      ...s,
      items: items
        .filter(i => Number(i.quote_id) === Number(q.id) && Number(i.spec_index) === Number(s.spec_index))
        .map(i => ({
          id: i.id,
          name: i.name,
          price: Number(i.price || 0),
          qty: Number(i.qty || 1),
          currency: String(i.currency || 'BRL'),
          section: i.section || ''
        }))
    }));
  return { quote: q, specs: qSpecs };
}

export function saveQuoteAndSpecs({ quote, specs }) {
  const wb = loadWorkbook();
  const quotes = sheetToJson(wb, 'quotes');
  let nextId = quotes.reduce((m, r) => Math.max(m, Number(r.id || 0)), 0) + 1;
  const now = new Date().toISOString();
  const existing = quotes.find(r => String(r.quote_code).trim() === String(quote.quote_code).trim());
  let quoteId;
  if (existing) {
    quoteId = existing.id;
    Object.assign(existing, {
      ...quote,
      id: existing.id,
      created_at: existing.created_at || now,
      updated_at: now
    });
  } else {
    quoteId = nextId;
    quotes.push({
      id: quoteId,
      ...quote,
      created_at: now,
      updated_at: now
    });
  }

  const specsSheet = sheetToJson(wb, 'specs');
  const itemsSheet = sheetToJson(wb, 'items');

  // Remove specs/items do quote
  const specsFiltered = specsSheet.filter(s => Number(s.quote_id) !== Number(quoteId));
  const itemsFiltered = itemsSheet.filter(i => Number(i.quote_id) !== Number(quoteId));

  // Reinsere
  let specAutoId = specsFiltered.reduce((m, r) => Math.max(m, Number(r.id || 0)), 0) + 1;
  let itemAutoId = itemsFiltered.reduce((m, r) => Math.max(m, Number(r.id || 0)), 0) + 1;

  (specs || []).forEach((s, idx) => {
    specsFiltered.push({
      id: specAutoId++, quote_id: quoteId, spec_index: idx,
      description: s.description || '', image_path: s.image_path || ''
    });
    (s.items || []).forEach(it => {
      itemsFiltered.push({
        id: itemAutoId++,
        quote_id: quoteId,
        spec_index: idx,
        name: it.name || '',
        price: Number(it.price || 0),
        qty: Number(it.qty || 1),
        currency: String(it.currency || 'BRL'),
        section: s.description || ''
      });
    });
  });

  writeRows(wb, 'quotes', quotes);
  writeRows(wb, 'specs', specsFiltered);
  writeRows(wb, 'items', itemsFiltered);
  saveWorkbook(wb);
  return quoteId;
}
