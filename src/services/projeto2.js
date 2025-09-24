import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

function toAOA(items){
  const aoa = [['Descrição','Qtd','Unitário','Moeda','Subtotal']];
  let totals = { BRL:0, USD:0, EUR:0 };
  (items||[]).forEach(it=>{
    const qty = Number(it.qty||1);
    const unit = Number(it.unit||it.price||0);
    const cur = String(it.currency||'BRL').toUpperCase();
    const sub = qty*unit;
    totals[cur]=(totals[cur]||0)+sub;
    aoa.push([it.name||'', qty, unit, cur, sub]);
  });
  aoa.push([]);
  aoa.push(['Totais BRL','','','', totals.BRL||0]);
  aoa.push(['Totais USD','','','', totals.USD||0]);
  aoa.push(['Totais EUR','','','', totals.EUR||0]);
  return aoa;
}

export function generateXlsxFromData({ quote, specs }){
  const wb = XLSX.utils.book_new();
  const resumo = [
    ['Proposta', quote.quote_code],
    ['Cliente', quote.client || quote.company || ''],
    ['CNPJ', quote.cnpj || ''],
    ['Modelo', quote.machine_model || ''],
    ['Data', quote.date],
    ['Validade (dias)', quote.validity_days],
    ['Prazo Entrega', quote.delivery_time||''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), 'Resumo');

  const itemsEquip=[], itemsAssessoria=[], itemsOperacionais=[], itemsCertificados=[];
  (specs||[]).forEach(s=>{
    const sec=(s.description||'').toUpperCase();
    (s.items||[]).forEach(it=>{
      const r={ name:it.name, qty:it.qty||1, unit:it.price||0, currency:(it.currency||'BRL').toUpperCase() };
      if(sec.includes('EQUIP')) itemsEquip.push(r);
      else if(sec.includes('ASSESS')) itemsAssessoria.push(r);
      else if(sec.includes('OPERACION')) itemsOperacionais.push(r);
      else if(sec.includes('CERTIFIC')) itemsCertificados.push(r);
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsEquip)), 'Equipamentos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsAssessoria)), 'Assessoria');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsOperacionais)), 'Operacionais');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsCertificados)), 'Certificados');

  const baseDir = path.join(path.dirname(new URL(import.meta.url).pathname),'..','..');
  const outDir = path.join(baseDir,'output');
  fs.mkdirSync(outDir,{recursive:true});
  const outPath = path.join(outDir, `${quote.quote_code}.xlsx`);
  XLSX.writeFile(wb,outPath);
  return outPath;
}

