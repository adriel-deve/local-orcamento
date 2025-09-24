import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import { generatePdfFromData } from '../services/pdfgen.js';
import { generateXlsxFromData } from '../services/xlsxgen.js';
import { initDatabase, saveQuoteAndSpecs, getQuoteByCode, getAllQuotes } from '../storage/database.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

function parseServices(body) {
  const arr = Array.isArray(body.services) ? body.services : (body.services ? [body.services] : []);
  return arr.join(';');
}

function normalizeItem(it) {
  const qty = Number(it.qty || 1);
  const unit = Number(it.unit || it.price || 0);
  const currency = String(it.currency || 'BRL').toUpperCase();
  return { name: it.name || '', qty, unit, currency, subtotal: qty * unit };
}

function categorizeSpecs(specs) {
  const sections = {
    equipamentos_a: { key: 'equipamentos_a', title: 'Modalidade A - Equipamentos (CIF)', items: [] },
    assessoria_a: { key: 'assessoria_a', title: 'Modalidade A - Serviços de Assessoria (CIF)', items: [] },
    operacionais_a: { key: 'operacionais_a', title: 'Modalidade A - Serviços Operacionais (CIF)', items: [] },
    certificados_a: { key: 'certificados_a', title: 'Modalidade A - Certificados (CIF)', items: [] },
    equipamentos_b: { key: 'equipamentos_b', title: 'Modalidade B - Equipamentos (FOB)', items: [] },
    assessoria_b: { key: 'assessoria_b', title: 'Modalidade B - Serviços de Assessoria (FOB)', items: [] },
    operacionais_b: { key: 'operacionais_b', title: 'Modalidade B - Serviços Operacionais (FOB)', items: [] },
    certificados_b: { key: 'certificados_b', title: 'Modalidade B - Certificados (FOB)', items: [] }
  };
  (specs || []).forEach(s => {
    const sec = (s.description || '').toUpperCase();
    (s.items || []).forEach(it => {
      const item = normalizeItem(it);
      if (sec.includes('EQUIPAMENTOS_A')) sections.equipamentos_a.items.push(item);
      else if (sec.includes('ASSESSORIA_A')) sections.assessoria_a.items.push(item);
      else if (sec.includes('OPERACIONAIS_A')) sections.operacionais_a.items.push(item);
      else if (sec.includes('CERTIFICADOS_A')) sections.certificados_a.items.push(item);
      else if (sec.includes('EQUIPAMENTOS_B')) sections.equipamentos_b.items.push(item);
      else if (sec.includes('ASSESSORIA_B')) sections.assessoria_b.items.push(item);
      else if (sec.includes('OPERACIONAIS_B')) sections.operacionais_b.items.push(item);
      else if (sec.includes('CERTIFICADOS_B')) sections.certificados_b.items.push(item);
    });
  });
  return sections;
}

function totalsFor(items) {
  const totals = { BRL: 0, USD: 0, EUR: 0 };
  (items || []).forEach(it => {
    totals[it.currency] = (totals[it.currency] || 0) + it.subtotal;
  });
  return totals;
}

function categorizeAndSummarizeFromFormPayload(payload) {
  const sections = [];

  // Collect all currencies used
  const usedCurrencies = new Set();
  const allItems = [];

  // Helper function to collect items and currencies
  function collectItems(items) {
    if (items && items.length > 0) {
      items.forEach(item => {
        usedCurrencies.add(item.currency);
        allItems.push(item);
      });
    }
  }

  // Modalidade A - só adiciona se tiver itens
  const modalidadeASections = [];
  if ((payload.sections.itemsEquipA || []).length > 0) {
    collectItems(payload.sections.itemsEquipA);
    modalidadeASections.push({ description: 'EQUIPAMENTOS_A', items: payload.sections.itemsEquipA });
  }
  if ((payload.sections.itemsAssessoriaA || []).length > 0) {
    collectItems(payload.sections.itemsAssessoriaA);
    modalidadeASections.push({ description: 'ASSESSORIA_A', items: payload.sections.itemsAssessoriaA });
  }
  if ((payload.sections.itemsOperacionaisA || []).length > 0) {
    collectItems(payload.sections.itemsOperacionaisA);
    modalidadeASections.push({ description: 'OPERACIONAIS_A', items: payload.sections.itemsOperacionaisA });
  }
  if ((payload.sections.itemsCertificadosA || []).length > 0) {
    collectItems(payload.sections.itemsCertificadosA);
    modalidadeASections.push({ description: 'CERTIFICADOS_A', items: payload.sections.itemsCertificadosA });
  }

  // Modalidade B - só adiciona se tiver itens
  const modalidadeBSections = [];
  if ((payload.sections.itemsEquipB || []).length > 0) {
    collectItems(payload.sections.itemsEquipB);
    modalidadeBSections.push({ description: 'EQUIPAMENTOS_B', items: payload.sections.itemsEquipB });
  }
  if ((payload.sections.itemsAssessoriaB || []).length > 0) {
    collectItems(payload.sections.itemsAssessoriaB);
    modalidadeBSections.push({ description: 'ASSESSORIA_B', items: payload.sections.itemsAssessoriaB });
  }
  if ((payload.sections.itemsOperacionaisB || []).length > 0) {
    collectItems(payload.sections.itemsOperacionaisB);
    modalidadeBSections.push({ description: 'OPERACIONAIS_B', items: payload.sections.itemsOperacionaisB });
  }
  if ((payload.sections.itemsCertificadosB || []).length > 0) {
    collectItems(payload.sections.itemsCertificadosB);
    modalidadeBSections.push({ description: 'CERTIFICADOS_B', items: payload.sections.itemsCertificadosB });
  }

  // Validação: máximo 2 moedas
  const currencyArray = Array.from(usedCurrencies);
  if (currencyArray.length > 2) {
    throw new Error(`Erro: Máximo 2 moedas permitidas na cotação. Encontradas: ${currencyArray.join(', ')}. Por favor, use apenas 2 moedas diferentes.`);
  }

  // Combine as seções
  sections.push(...modalidadeASections, ...modalidadeBSections);

  const categorized = categorizeSpecs(sections);
  const processedSections = Object.values(categorized).map(section => ({
    ...section,
    totals: totalsFor(section.items)
  }));

  // Calculate totals by modalidade and currency
  const totals = {
    modalidadeA: { BRL: 0, USD: 0, EUR: 0 },
    modalidadeB: { BRL: 0, USD: 0, EUR: 0 },
    general: { BRL: 0, USD: 0, EUR: 0 },
    usedCurrencies: currencyArray
  };

  processedSections.forEach(section => {
    const sectionTotals = section.totals;

    // Add to general totals
    totals.general.BRL += sectionTotals.BRL || 0;
    totals.general.USD += sectionTotals.USD || 0;
    totals.general.EUR += sectionTotals.EUR || 0;

    // Add to modalidade-specific totals
    if (section.key.includes('_a')) {
      totals.modalidadeA.BRL += sectionTotals.BRL || 0;
      totals.modalidadeA.USD += sectionTotals.USD || 0;
      totals.modalidadeA.EUR += sectionTotals.EUR || 0;
    } else if (section.key.includes('_b')) {
      totals.modalidadeB.BRL += sectionTotals.BRL || 0;
      totals.modalidadeB.USD += sectionTotals.USD || 0;
      totals.modalidadeB.EUR += sectionTotals.EUR || 0;
    }
  });

  return { sections: processedSections, totals };
}

// Preview HTML directly from form data without saving or generating files
router.post('/preview-html', upload.any(), async (req, res) => {
  try {
    const payload = JSON.parse(req.body.specs_json || '{}');

    // Process uploaded image
    let equipmentImagePath = null;
    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find(f => f.fieldname === 'equipment_image');
      if (imageFile) {
        // Use absolute path for PDF generation
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        equipmentImagePath = `${baseUrl}/uploads/${imageFile.filename}`;
      }
    }

    const quote = {
      quote_code: req.body.quote_code || 'PREVIEW',
      date: req.body.date,
      company: req.body.company,
      client: req.body.client || req.body.company || '',
      cnpj: req.body.cnpj || '',
      machine_model: req.body.machine_model || '',
      tech_spec: payload.tech_spec || '',
      principle: payload.principle || '',
      representative: req.body.representative,
      supplier: req.body.supplier,
      services: parseServices(req.body),
      validity_days: Number(req.body.validity) || 15,
      delivery_time: req.body.delivery,
      notes: req.body.notes || '',
      contact_email: req.body.contact_email || '',
      contact_phone: req.body.contact_phone || '',
      seller_name: req.body.seller_name || '',
      equipment_image: equipmentImagePath,
      status: 'Pré-visualização'
    };
    const { sections, totals } = categorizeAndSummarizeFromFormPayload(payload || { sections: {} });
    return res.render('quotes/layout-print', { quote, sections, totals });
  } catch (e) {
    return res.status(400).send('Falha ao pré-visualizar: ' + e.message);
  }
});

// Generate PDF directly from form data without saving
router.post('/generate-pdf', upload.any(), async (req, res) => {
  try {
    console.log('Iniciando geração PDF...');
    const payload = JSON.parse(req.body.specs_json || '{}');

    // Process uploaded image
    let equipmentImagePath = null;
    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find(f => f.fieldname === 'equipment_image');
      if (imageFile) {
        // Use absolute path for PDF generation
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        equipmentImagePath = `${baseUrl}/uploads/${imageFile.filename}`;
      }
    }

    const quote = {
      quote_code: req.body.quote_code || `PDF-${Date.now()}`,
      date: req.body.date,
      company: req.body.company,
      client: req.body.client || req.body.company || '',
      cnpj: req.body.cnpj || '',
      machine_model: req.body.machine_model || '',
      tech_spec: payload.tech_spec || '',
      principle: payload.principle || '',
      representative: req.body.representative,
      supplier: req.body.supplier,
      services: parseServices(req.body),
      validity_days: Number(req.body.validity) || 15,
      delivery_time: req.body.delivery,
      notes: req.body.notes || '',
      contact_email: req.body.contact_email || '',
      contact_phone: req.body.contact_phone || '',
      seller_name: req.body.seller_name || '',
      equipment_image: equipmentImagePath,
      // Condições de pagamento
      include_payment_conditions: req.body.include_payment_conditions === 'on',
      payment_intro: req.body.payment_intro || '',
      payment_usd_conditions: req.body.payment_usd_conditions || '',
      payment_brl_intro: req.body.payment_brl_intro || '',
      payment_brl_with_sat: req.body.payment_brl_with_sat || '',
      payment_brl_without_sat: req.body.payment_brl_without_sat || '',
      payment_additional_notes: req.body.payment_additional_notes || '',
      status: 'Geração PDF'
    };

    const { sections, totals } = categorizeAndSummarizeFromFormPayload(payload || { sections: {} });

    // Generate HTML content
    const html = await new Promise((resolve, reject) => {
      res.app.render('quotes/layout-print', { quote, sections, totals }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Use puppeteer for reliable PDF generation
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const baseDir = process.cwd();
    const outDir = path.join(baseDir, 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const fileName = `${quote.quote_code}.pdf`;
    const outPath = path.join(outDir, fileName);

    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });

    await browser.close();

    console.log('PDF gerado com sucesso:', outPath);

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(outPath);
    fileStream.pipe(res);

  } catch (e) {
    console.error('Erro ao gerar PDF:', e);
    return res.status(500).send('Falha ao gerar PDF: ' + e.message);
  }
});


router.get('/new', async (_req, res) => {
// initDatabase() removed - handled at app startup
  res.render('quotes/new');
});

router.get('/:code', async (req, res) => {
// initDatabase() removed - handled at app startup
  const code = req.params.code;
  const data = getQuoteByCode(code);
  if (!data) return res.status(404).render('404', { message: 'Cotação não encontrada' });
  res.render('quotes/view', { quote: data.quote, specs: data.specs });
});

router.get('/:code/layout', async (req, res) => {
// initDatabase() removed - handled at app startup
  const code = req.params.code;
  const data = getQuoteByCode(code);
  if (!data) return res.status(404).send('Cotação não encontrada');
  const categorized = categorizeSpecs(data.specs);
  const sections = Object.values(categorized).map(section => ({
    ...section,
    totals: totalsFor(section.items)
  }));
  const totals = sections.reduce((acc, section) => {
    const t = section.totals;
    acc.BRL += t.BRL || 0;
    acc.USD += t.USD || 0;
    acc.EUR += t.EUR || 0;
    return acc;
  }, { BRL: 0, USD: 0, EUR: 0 });

  res.render('quotes/layout', { quote: data.quote, sections, totals });
});

router.post('/save', upload.any(), async (req, res, next) => {
  try {
    const data = JSON.parse(req.body.specs_json || '{"sections":{}}');
    const sections = data.sections || {};

    const quote = {
      quote_code: req.body.quote_code,
      date: req.body.date,
      company: req.body.company,
      client: req.body.client || req.body.company || '',
      cnpj: req.body.cnpj || '',
      machine_model: req.body.machine_model || '',
      tech_spec: data.tech_spec || '',
      principle: data.principle || '',
      representative: req.body.representative,
      supplier: req.body.supplier,
      services: parseServices(req.body),
      validity_days: Number(req.body.validity) || 15,
      delivery_time: req.body.delivery,
      notes: req.body.notes || '',
      status: 'Rascunho'
    };

  // initDatabase() removed - handled at app startup
    function packItems(arr, secName) {
      return (arr || []).map(it => ({
        description: secName,
        name: it.name || it.description || '',
        price: Number(it.unit || it.unit_price || it.price || 0),
        qty: Number(it.qty || 1),
        currency: String(it.currency || 'BRL').toUpperCase()
      }));
    }

    const specsPrepared = [];

    // Modalidade A
    if (sections.itemsEquipA && sections.itemsEquipA.length > 0) {
      specsPrepared.push({ description: 'EQUIPAMENTOS_A', items: packItems(sections.itemsEquipA, 'EQUIPAMENTOS_A') });
    }
    if (sections.itemsAssessoriaA && sections.itemsAssessoriaA.length > 0) {
      specsPrepared.push({ description: 'ASSESSORIA_A', items: packItems(sections.itemsAssessoriaA, 'ASSESSORIA_A') });
    }
    if (sections.itemsOperacionaisA && sections.itemsOperacionaisA.length > 0) {
      specsPrepared.push({ description: 'OPERACIONAIS_A', items: packItems(sections.itemsOperacionaisA, 'OPERACIONAIS_A') });
    }
    if (sections.itemsCertificadosA && sections.itemsCertificadosA.length > 0) {
      specsPrepared.push({ description: 'CERTIFICADOS_A', items: packItems(sections.itemsCertificadosA, 'CERTIFICADOS_A') });
    }

    // Modalidade B
    if (sections.itemsEquipB && sections.itemsEquipB.length > 0) {
      specsPrepared.push({ description: 'EQUIPAMENTOS_B', items: packItems(sections.itemsEquipB, 'EQUIPAMENTOS_B') });
    }
    if (sections.itemsAssessoriaB && sections.itemsAssessoriaB.length > 0) {
      specsPrepared.push({ description: 'ASSESSORIA_B', items: packItems(sections.itemsAssessoriaB, 'ASSESSORIA_B') });
    }
    if (sections.itemsOperacionaisB && sections.itemsOperacionaisB.length > 0) {
      specsPrepared.push({ description: 'OPERACIONAIS_B', items: packItems(sections.itemsOperacionaisB, 'OPERACIONAIS_B') });
    }
    if (sections.itemsCertificadosB && sections.itemsCertificadosB.length > 0) {
      specsPrepared.push({ description: 'CERTIFICADOS_B', items: packItems(sections.itemsCertificadosB, 'CERTIFICADOS_B') });
    }

    saveQuoteAndSpecs({ quote, specs: specsPrepared });


    const act = (req.body.action || '').toLowerCase();
    if (act === 'preview') {
      res.redirect(`/quotes/${quote.quote_code}/layout`);
    } else {
      res.redirect(`/quotes/${quote.quote_code}`);
    }
  } catch (err) {
    next(err);
  }
});


router.get('/:code/xlsx', async (req, res) => {
  try {
    const code = req.params.code;
    const baseDir = process.cwd();
    const outDir = path.join(baseDir, 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const data = getQuoteByCode(code);
    if (!data) return res.status(404).send('Cotação não encontrada');
    const outPath = generateXlsxFromData({ quote: data.quote, specs: data.specs });
    const fileName = path.basename(outPath);
    const publicUrl = `/output/${fileName}`;
    return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><title>Excel</title></head><body>
      <p style="font-family:Segoe UI,Arial">Excel gerado. Verifique na pasta de saída.</p>
      <p style="font-family:Segoe UI,Arial"><strong>Arquivo:</strong> ${outPath}</p>
      <p style="font-family:Segoe UI,Arial"><a href="${publicUrl}">Abrir/baixar agora</a></p>
    </body></html>`);
  } catch (e) {
    return res.status(500).send('Falha ao gerar Excel: ' + e.message);
  }
});

router.get('/:code/pdf', async (req, res) => {
  try {
    const code = req.params.code;
    const baseDir = process.cwd();
    const outDir = path.join(baseDir, 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const data = getQuoteByCode(code);
    if (!data) return res.status(404).send('Cotação não encontrada');
    const outPath = await generatePdfFromData({ quote: data.quote, specs: data.specs });
    const fileName = path.basename(outPath);
    const publicUrl = `/output/${fileName}`;
    return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><title>PDF</title></head><body>
      <p style="font-family:Segoe UI,Arial">PDF gerado. Verifique na pasta de saída.</p>
      <p style="font-family:Segoe UI,Arial"><strong>Arquivo:</strong> ${outPath}</p>
      <p style="font-family:Segoe UI,Arial"><a href="${publicUrl}">Abrir/baixar agora</a></p>
    </body></html>`);
  } catch (e) {
    return res.status(500).send('Falha ao gerar PDF: ' + e.message);
  }
});

export default router;
