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

export function generateXlsxFromData({ quote, specs, enableConfig }){
  // Default enableConfig if not provided
  const config = enableConfig || {
    enableModalidadeA: true,
    enableModalidadeB: true,
    enableSections: {
      equipA: true,
      assessoriaA: true,
      operacionaisA: true,
      certificadosA: true,
      equipB: true,
      assessoriaB: true,
      operacionaisB: true,
      certificadosB: true
    }
  };

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

  // Separate items by modalidade and section
  const itemsEquipA=[], itemsAssessoriaA=[], itemsOperacionaisA=[], itemsCertificadosA=[];
  const itemsEquipB=[], itemsAssessoriaB=[], itemsOperacionaisB=[], itemsCertificadosB=[];

  (specs||[]).forEach(s=>{
    const sec=(s.description||'').toUpperCase();
    const isModalidadeA = sec.includes('MODALIDADE A');
    const isModalidadeB = sec.includes('MODALIDADE B');

    (s.items||[]).forEach(it=>{
      const r={ name:it.name, qty:it.qty||1, unit:it.price||0, currency:(it.currency||'BRL').toUpperCase() };

      if(isModalidadeA) {
        if(sec.includes('EQUIP')) itemsEquipA.push(r);
        else if(sec.includes('ASSESS')) itemsAssessoriaA.push(r);
        else if(sec.includes('OPERACION')) itemsOperacionaisA.push(r);
        else if(sec.includes('CERTIFIC')) itemsCertificadosA.push(r);
      } else if(isModalidadeB) {
        if(sec.includes('EQUIP')) itemsEquipB.push(r);
        else if(sec.includes('ASSESS')) itemsAssessoriaB.push(r);
        else if(sec.includes('OPERACION')) itemsOperacionaisB.push(r);
        else if(sec.includes('CERTIFIC')) itemsCertificadosB.push(r);
      }
    });
  });

  // Add sheets only for enabled modalidades and sections
  if (config.enableModalidadeA) {
    if (config.enableSections.equipA) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsEquipA)), 'Equip A (CIF)');
    }
    if (config.enableSections.assessoriaA) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsAssessoriaA)), 'Assessoria A (CIF)');
    }
    if (config.enableSections.operacionaisA) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsOperacionaisA)), 'Operacionais A (CIF)');
    }
    if (config.enableSections.certificadosA) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsCertificadosA)), 'Certificados A (CIF)');
    }
  }

  if (config.enableModalidadeB) {
    if (config.enableSections.equipB) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsEquipB)), 'Equip B (FOB)');
    }
    if (config.enableSections.assessoriaB) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsAssessoriaB)), 'Assessoria B (FOB)');
    }
    if (config.enableSections.operacionaisB) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsOperacionaisB)), 'Operacionais B (FOB)');
    }
    if (config.enableSections.certificadosB) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toAOA(itemsCertificadosB)), 'Certificados B (FOB)');
    }
  }

  const baseDir = path.join(path.dirname(new URL(import.meta.url).pathname),'..','..');
  const outDir = path.join(baseDir,'output');
  fs.mkdirSync(outDir,{recursive:true});
  const outPath = path.join(outDir, `${quote.quote_code}.xlsx`);
  XLSX.writeFile(wb,outPath);
  return outPath;
}

