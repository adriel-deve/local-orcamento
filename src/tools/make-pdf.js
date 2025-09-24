import { initExcel, getQuoteByCode } from '../storage/excel.js';
import { generatePdfFromData } from '../services/pdfgen.js';

async function main(){
  const code = process.argv[2];
  if(!code){ console.error('Uso: node src/tools/make-pdf.js <QUOTE_CODE>'); process.exit(1); }
  initExcel();
  const data = getQuoteByCode(code);
  if(!data){ console.error('Cotação não encontrada:', code); process.exit(1); }
  const outPath = await generatePdfFromData({ quote: data.quote, specs: data.specs });
  console.log('PDF gerado em', outPath);
}

main().catch(e=>{ console.error('Falha:', e.message); process.exit(1); });
