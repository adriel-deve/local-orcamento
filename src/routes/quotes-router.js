import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import os from 'os';
import { generatePdfFromData } from '../services/pdfgen.js';
import { generateXlsxFromData } from '../services/xlsxgen.js';
import { initDatabase, saveQuoteAndSpecs, getQuoteByCode, getAllQuotes, deleteQuote, updateQuoteBusinessStatus, getDashboardStats } from '../storage/database.js';

const router = Router();

const isProduction = process.env.NODE_ENV === 'production';
const uploadDir = isProduction ?
  path.join(os.tmpdir(), 'local-orcamentos', 'uploads') :
  path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }
});

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

// Save as completed and then preview
router.post('/save-and-preview', upload.any(), async (req, res) => {
  try {
    console.log('Salvando cotação como concluída e gerando pré-visualização...');
    const payload = JSON.parse(req.body.specs_json || '{}');

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let equipmentImagePath = req.body.existing_equipment_image || req.body.equipment_image_url || null;

    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find(f => f.fieldname === 'equipment_image');
      if (imageFile) {
        equipmentImagePath = `${baseUrl}/uploads/${imageFile.filename}`;
      }
    }

    if (equipmentImagePath) {
      const trimmed = String(equipmentImagePath).trim();
      if (!trimmed) {
        equipmentImagePath = null;
      } else if (trimmed.startsWith('data:')) {
        equipmentImagePath = trimmed;
      } else if (/^https?:/i.test(trimmed)) {
        equipmentImagePath = trimmed;
      } else {
        const sanitized = trimmed.replace(/^\/+/, '');
        equipmentImagePath = `${baseUrl}/${sanitized}`;
      }
    }

    const quote = {
      quote_code: req.body.quote_code || `COT-${Date.now()}`,
      date: req.body.date || new Date().toISOString().split('T')[0],
      company: req.body.company || '',
      client: req.body.client || req.body.company || '',
      cnpj: req.body.cnpj || '',
      machine_model: req.body.machine_model || '',
      tech_spec: payload.tech_spec || '',
      principle: payload.principle || '',
      representative: req.body.representative || '',
      supplier: req.body.supplier || 'Fornecedor',
      services: parseServices(req.body) || '',
      validity_days: parseInt(req.body.validity) || 15,
      delivery_time: req.body.delivery || null,
      notes: req.body.notes || null,
      status: req.body.status || 'Concluída', // Status como concluída
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
      payment_additional_notes: req.body.payment_additional_notes || ''
    };

    // Processar specs do payload
    const specs = [];
    const sections = payload.sections || {};

    // Helper para processar seções
    function processSection(items, description) {
      if (items && items.length > 0) {
        specs.push({
          description,
          items: items.map(item => ({
            name: item.name,
            price: parseFloat(item.unit) || 0,
            qty: parseInt(item.qty) || 1,
            currency: item.currency || 'BRL'
          }))
        });
      }
    }

    // Modalidade A
    processSection(sections.itemsEquipA, 'EQUIPAMENTOS_A');
    processSection(sections.itemsAssessoriaA, 'ASSESSORIA_A');
    processSection(sections.itemsOperacionaisA, 'OPERACIONAIS_A');
    processSection(sections.itemsCertificadosA, 'CERTIFICADOS_A');

    // Modalidade B
    processSection(sections.itemsEquipB, 'EQUIPAMENTOS_B');
    processSection(sections.itemsAssessoriaB, 'ASSESSORIA_B');
    processSection(sections.itemsOperacionaisB, 'OPERACIONAIS_B');
    processSection(sections.itemsCertificadosB, 'CERTIFICADOS_B');

    // Salvar no banco
    await saveQuoteAndSpecs({ quote, specs });

    // Gerar pré-visualização com os dados salvos
    const { sections: processedSections, totals } = categorizeAndSummarizeFromFormPayload(payload || { sections: {} });
    return res.render('quotes/layout-print', { quote, sections: processedSections, totals });

  } catch (e) {
    return res.status(400).send('Falha ao salvar e pré-visualizar: ' + e.message);
  }
});

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
      status: 'Pré-visualização',
      // Condições de pagamento
      include_payment_conditions: req.body.include_payment_conditions === 'on',
      payment_intro: req.body.payment_intro || '',
      payment_usd_conditions: req.body.payment_usd_conditions || '',
      payment_brl_intro: req.body.payment_brl_intro || '',
      payment_brl_with_sat: req.body.payment_brl_with_sat || '',
      payment_brl_without_sat: req.body.payment_brl_without_sat || '',
      payment_additional_notes: req.body.payment_additional_notes || ''
    };
    const { sections, totals } = categorizeAndSummarizeFromFormPayload(payload || { sections: {} });
    return res.render('quotes/layout-print', { quote, sections, totals });
  } catch (e) {
    return res.status(400).send('Falha ao pré-visualizar: ' + e.message);
  }
});

// Test PDF generation
router.get('/test-pdf', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

    const { default: PDFDocument } = await import('pdfkit');
    const doc = new PDFDocument();

    doc.pipe(res);
    doc.fontSize(20).text('Teste de PDF - Local Orçamentos', 100, 100);
    doc.text('Se você está vendo este texto, a geração de PDF está funcionando!', 100, 150);
    doc.end();
  } catch (error) {
    console.error('Erro no teste PDF:', error);
    res.status(500).send('Erro ao gerar PDF de teste: ' + error.message);
  }
});

// Generate PDF - Redirect to print dialog (browser native PDF generation)
router.post('/generate-pdf', upload.any(), async (req, res) => {
  // Server-side PDF generation disabled - use browser print functionality
  return res.status(200).json({
    success: false,
    message: 'Use browser print dialog (Ctrl+P) to generate PDF',
    redirect: 'print'
  });
});
router.get('/new', async (_req, res) => {
// initDatabase() removed - handled at app startup
  res.render('quotes/new');
});

// Página de Rascunhos
router.get('/drafts', async (_req, res) => {
  try {
    const allQuotes = await getAllQuotes();
    const drafts = allQuotes.filter(quote => quote.status === 'Rascunho');
    res.render('quotes/drafts', { quotes: drafts });
  } catch (error) {
    console.error('Erro ao buscar rascunhos:', error);
    res.render('quotes/drafts', { quotes: [] });
  }
});

// Página de Cotações Concluídas
router.get('/completed', async (_req, res) => {
  try {
    const allQuotes = await getAllQuotes();
    const completed = allQuotes.filter(quote => quote.status === 'Concluída');
    res.render('quotes/completed', { quotes: completed });
  } catch (error) {
    console.error('Erro ao buscar cotações concluídas:', error);
    res.render('quotes/completed', { quotes: [] });
  }
});

// Save draft to database
router.post('/save-draft', upload.any(), async (req, res) => {
  try {
    console.log('Salvando rascunho no banco...');
    const payload = JSON.parse(req.body.specs_json || '{}');

    // Process uploaded image
    let equipmentImagePath = null;
    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find(f => f.fieldname === 'equipment_image');
      if (imageFile) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        equipmentImagePath = `${baseUrl}/uploads/${imageFile.filename}`;
      }
    }

    const quote = {
      quote_code: req.body.quote_code || `RASCUNHO-${Date.now()}`,
      date: req.body.date || new Date().toISOString().split('T')[0],
      company: req.body.company || '',
      client: req.body.client || req.body.company || '',
      cnpj: req.body.cnpj || '',
      machine_model: req.body.machine_model || '',
      tech_spec: payload.tech_spec || '',
      principle: payload.principle || '',
      representative: req.body.representative || '',
      supplier: req.body.supplier || 'Fornecedor',
      services: parseServices(req.body) || '',
      validity_days: parseInt(req.body.validity) || 15,
      delivery_time: req.body.delivery || null,
      notes: req.body.notes || null,
      status: 'Rascunho',
      contact_email: req.body.contact_email || '',
      contact_phone: req.body.contact_phone || '',
      seller_name: req.body.seller_name || '',
      equipment_image: equipmentImagePath,
      user_id: req.session.userId, // Associar rascunho ao usuário logado
      // Condições de pagamento
      include_payment_conditions: req.body.include_payment_conditions === 'on',
      payment_intro: req.body.payment_intro || '',
      payment_usd_conditions: req.body.payment_usd_conditions || '',
      payment_brl_intro: req.body.payment_brl_intro || '',
      payment_brl_with_sat: req.body.payment_brl_with_sat || '',
      payment_brl_without_sat: req.body.payment_brl_without_sat || '',
      payment_additional_notes: req.body.payment_additional_notes || ''
    };

    // Processar specs do payload
    const specs = [];
    const sections = payload.sections || {};

    // Helper para processar seções
    function processSection(items, description) {
      if (items && items.length > 0) {
        specs.push({
          description,
          items: items.map(item => ({
            name: item.name,
            price: parseFloat(item.unit) || 0,
            qty: parseInt(item.qty) || 1,
            currency: item.currency || 'BRL'
          }))
        });
      }
    }

    // Modalidade A
    processSection(sections.itemsEquipA, 'EQUIPAMENTOS_A');
    processSection(sections.itemsAssessoriaA, 'ASSESSORIA_A');
    processSection(sections.itemsOperacionaisA, 'OPERACIONAIS_A');
    processSection(sections.itemsCertificadosA, 'CERTIFICADOS_A');

    // Modalidade B
    processSection(sections.itemsEquipB, 'EQUIPAMENTOS_B');
    processSection(sections.itemsAssessoriaB, 'ASSESSORIA_B');
    processSection(sections.itemsOperacionaisB, 'OPERACIONAIS_B');
    processSection(sections.itemsCertificadosB, 'CERTIFICADOS_B');

    // Salvar no banco
    const result = await saveQuoteAndSpecs({ quote, specs });

    if (result.success) {
      // Retornar JSON em vez de redirecionar
      res.json({
        success: true,
        message: 'Rascunho salvo com sucesso!',
        quote_code: quote.quote_code,
        location: 'Rascunhos'
      });
    } else {
      throw new Error('Falha ao salvar rascunho no banco de dados');
    }

  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar rascunho: ' + error.message
    });
  }
});

// Save quote to database
router.post('/save', upload.any(), async (req, res) => {
  try {
    console.log('Salvando orçamento no banco...');
    const payload = JSON.parse(req.body.specs_json || '{}');

    const quote = {
      quote_code: req.body.quote_code || `COT-${Date.now()}`,
      date: req.body.date || new Date().toISOString().split('T')[0],
      company: req.body.company || '',
      representative: req.body.representative || '',
      supplier: req.body.supplier || 'Fornecedor',
      services: parseServices(req.body) || '',
      validity_days: parseInt(req.body.validity) || 15,
      delivery_time: req.body.delivery || null,
      notes: req.body.notes || null,
      status: 'Rascunho'
    };

    // Processar specs do payload
    const specs = [];
    const sections = payload.sections || {};

    // Modalidade A
    if (sections.itemsEquipA?.length > 0) {
      specs.push({
        description: 'EQUIPAMENTOS_A',
        items: sections.itemsEquipA.map(item => ({
          name: item.name,
          price: parseFloat(item.unit) || 0
        }))
      });
    }

    if (sections.itemsAssessoriaA?.length > 0) {
      specs.push({
        description: 'ASSESSORIA_A',
        items: sections.itemsAssessoriaA.map(item => ({
          name: item.name,
          price: parseFloat(item.unit) || 0
        }))
      });
    }

    // Salvar no banco
    const result = await saveQuoteAndSpecs({ quote, specs });

    if (result.success) {
      res.redirect(`/?saved=${quote.quote_code}`);
    } else {
      throw new Error('Falha ao salvar no banco de dados');
    }

  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    res.status(500).send('Erro ao salvar orçamento: ' + error.message);
  }
});

// Rotas específicas ANTES da rota catch-all /:code
router.get('/list', async (req, res) => {
  try {
    const allQuotes = await getAllQuotes();
    res.json(allQuotes);
  } catch (error) {
    console.error('Erro ao buscar lista de cotações:', error);
    res.status(500).json({ error: 'Erro ao carregar lista de cotações' });
  }
});

router.get('/:code', async (req, res) => {
// initDatabase() removed - handled at app startup
  const code = req.params.code;
  const data = await getQuoteByCode(code);
  if (!data) return res.status(404).render('404', { message: 'Cotação não encontrada' });
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

  res.render('quotes/layout-print', { quote: data.quote, sections, totals });
});

router.get('/:code/layout', async (req, res) => {
// initDatabase() removed - handled at app startup
  const code = req.params.code;
  const data = await getQuoteByCode(code);
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

  res.render('quotes/layout-print', { quote: data.quote, sections, totals });
});

router.post('/save', upload.any(), async (req, res, next) => {
  try {
    const data = JSON.parse(req.body.specs_json || '{"sections":{}}');
    const sections = data.sections || {};

    // Process uploaded equipment images
    let equipment_image_path = null;
    if (req.files && req.files.length > 0) {
      const equipmentImage = req.files.find(file => file.fieldname === 'equipment_image');
      if (equipmentImage) {
        equipment_image_path = '/uploads/' + equipmentImage.filename;
      }
    }

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
      status: 'Rascunho',
      equipment_image: equipment_image_path
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

    await saveQuoteAndSpecs({ quote, specs: specsPrepared });


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
    const data = await getQuoteByCode(code);
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
    const data = await getQuoteByCode(code);
    if (!data) return res.status(404).send('Cotação não encontrada');
    const { outPath } = await generatePdfFromData({ quote: data.quote, specs: data.specs });
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

// API Routes for loading existing quotes
router.get('/load/:code', async (req, res) => {
  try {
    const quoteCode = req.params.code;
    const data = await getQuoteByCode(quoteCode);

    if (!data) {
      return res.status(404).json({ success: false, error: 'Cotação não encontrada' });
    }

    res.json({
      success: true,
      quote: data.quote,
      specs: data.specs
    });
  } catch (error) {
    console.error('Erro ao carregar cotação:', error);
    res.status(500).json({ success: false, error: 'Erro ao carregar dados da cotação' });
  }
});

// View quote route (redirect to layout)
router.get('/view/:code', async (req, res) => {
  res.redirect(`/quotes/${req.params.code}/layout`);
});

// Duplicate quote route
router.get('/duplicate/:code', async (req, res) => {
  try {
    const quoteCode = req.params.code;
    const quote = await getQuoteByCode(quoteCode);

    if (!quote) {
      return res.status(404).render('error', { message: 'Cotação não encontrada' });
    }

    // Generate new quote code with current timestamp
    const newQuoteCode = `${quote.quote_code}-COPY-${Date.now()}`;

    // Create duplicate with new code and draft status
    const duplicateQuote = {
      ...quote,
      quote_code: newQuoteCode,
      status: 'Rascunho',
      date: new Date().toISOString().split('T')[0]
    };

    // Redirect to new form with pre-filled data
    const queryParams = new URLSearchParams({
      quote_code: duplicateQuote.quote_code,
      date: duplicateQuote.date,
      company: duplicateQuote.company || '',
      client: duplicateQuote.client || '',
      cnpj: duplicateQuote.cnpj || '',
      machine_model: duplicateQuote.machine_model || '',
      representative: duplicateQuote.representative || '',
      supplier: duplicateQuote.supplier || '',
      services: duplicateQuote.services || '',
      validity_days: duplicateQuote.validity_days || 15,
      delivery_time: duplicateQuote.delivery_time || '',
      notes: duplicateQuote.notes || '',
      contact_email: duplicateQuote.contact_email || '',
      contact_phone: duplicateQuote.contact_phone || '',
      seller_name: duplicateQuote.seller_name || '',
      include_payment_conditions: duplicateQuote.include_payment_conditions || false,
      payment_intro: duplicateQuote.payment_intro || '',
      payment_usd_conditions: duplicateQuote.payment_usd_conditions || '',
      payment_brl_intro: duplicateQuote.payment_brl_intro || '',
      payment_brl_with_sat: duplicateQuote.payment_brl_with_sat || '',
      payment_brl_without_sat: duplicateQuote.payment_brl_without_sat || '',
      payment_additional_notes: duplicateQuote.payment_additional_notes || ''
    });

    res.redirect(`/quotes/new?${queryParams.toString()}`);
  } catch (error) {
    console.error('Erro ao duplicar cotação:', error);
    res.status(500).render('error', { message: 'Erro ao duplicar cotação' });
  }
});

// Delete quote route
// Deletar cotação (suporta DELETE e POST)
const handleDeleteQuote = async (req, res) => {
  try {
    const quoteCode = req.params.code;
    const userRole = req.session?.userRole;

    // Verificar se é admin
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Apenas administradores podem excluir cotações' });
    }

    console.log(`Solicitação para deletar cotação: ${quoteCode} por ${req.session?.username}`);
    const deleted = await deleteQuote(quoteCode);

    if (deleted) {
      console.log(`Cotação ${quoteCode} deletada com sucesso`);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Cotação não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao deletar cotação:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar cotação' });
  }
};

router.delete('/delete/:code', handleDeleteQuote);
router.post('/:code/delete', handleDeleteQuote);

// API: Dashboard Stats
router.get('/api/dashboard-stats', async (req, res) => {
  try {
    const userId = req.session?.userId;
    const userRole = req.session?.userRole;

    console.log(`[DASHBOARD STATS] User: ${userId}, Role: ${userRole}`);

    const stats = await getDashboardStats(userId, userRole);

    console.log('[DASHBOARD STATS] Stats:', JSON.stringify(stats, null, 2));

    res.json(stats);
  } catch (error) {
    console.error('[DASHBOARD STATS] Error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// API: Atualizar status de negócio da cotação
router.post('/:code/status', async (req, res) => {
  try {
    const { code } = req.params;
    const { status, purchaseOrder, reason } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    console.log(`[STATUS UPDATE] Quote: ${code}, Status: ${status}, User: ${userId}`);

    const updated = await updateQuoteBusinessStatus(code, status, userId, {
      purchaseOrder,
      reason
    });

    if (updated) {
      console.log(`[STATUS UPDATE] Success for quote ${code}`);
      res.json({ success: true });
    } else {
      console.log(`[STATUS UPDATE] Quote ${code} not found`);
      res.status(404).json({ success: false, error: 'Cotação não encontrada' });
    }
  } catch (error) {
    console.error('[STATUS UPDATE] Error:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar status: ' + error.message });
  }
});

export default router;








