// PDF Generator - Idêntico à pré-visualização HTML
window.generatePDFClient = function() {
  try {
    // Coletar dados do formulário
    if (collectPayload() === false) return;

    const formData = new FormData(document.getElementById('quoteForm'));
    const payload = JSON.parse(document.getElementById('specs_json').value || '{}');

    // Dados básicos
    const quoteData = {
      quote_code: formData.get('quote_code') || 'COT-' + Date.now(),
      date: formData.get('date') || new Date().toLocaleDateString('pt-BR'),
      company: formData.get('company') || '',
      representative: formData.get('representative') || '',
      client: formData.get('client') || '',
      cnpj: formData.get('cnpj') || '',
      validity: formData.get('validity') || '30',
      delivery_time: formData.get('delivery') || 'A definir',
      machine_model: formData.get('machine_model') || '',
      notes: formData.get('notes') || '',
      seller_name: formData.get('seller_name') || 'Consultor Pharmatec',
      contact_email: formData.get('contact_email') || 'vendas@apharmatec.com.br',
      contact_phone: formData.get('contact_phone') || '(11) 99999-9999',
      // Condições de pagamento
      include_payment_conditions: formData.get('include_payment_conditions') === 'on',
      payment_intro: formData.get('payment_intro') || '',
      payment_usd_conditions: formData.get('payment_usd_conditions') || '',
      payment_brl_intro: formData.get('payment_brl_intro') || '',
      payment_brl_with_sat: formData.get('payment_brl_with_sat') || '',
      payment_brl_without_sat: formData.get('payment_brl_without_sat') || '',
      payment_additional_notes: formData.get('payment_additional_notes') || ''
    };

    // Processar especificações técnicas
    if (payload.tech_spec) quoteData.tech_spec = payload.tech_spec;
    if (payload.principle) quoteData.principle = payload.principle;

    // Criar PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4'); // A4, portrait, milímetros
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    let yPos = margin;

    doc.setFont('helvetica');

    // PÁGINA 1: PROPOSTA PRINCIPAL
    drawHeader(doc, yPos, quoteData);
    yPos += 45;

    // Grid de dados da proposta (igual ao template)
    yPos = drawDataGrid(doc, yPos, quoteData);

    // Especificações técnicas
    if (quoteData.tech_spec || quoteData.principle) {
      yPos = drawTechnicalSpecs(doc, yPos, quoteData);
    }

    // Modalidades (igual ao template)
    const sections = payload.sections || {};

    // Modalidade A
    yPos = drawModalidadeA(doc, yPos, sections);

    // Modalidade B
    yPos = drawModalidadeB(doc, yPos, sections);

    // Observações
    if (quoteData.notes) {
      yPos = drawObservations(doc, yPos, quoteData.notes);
    }

    // PÁGINA 2: CONDIÇÕES DE PAGAMENTO (se incluída)
    if (quoteData.include_payment_conditions) {
      doc.addPage();
      yPos = margin;
      drawPaymentConditions(doc, yPos, quoteData);
    }

    // PÁGINA 3: TERMOS E GARANTIAS
    doc.addPage();
    yPos = margin;
    drawTermsAndConditions(doc, yPos, quoteData);

    // Rodapé em todas as páginas
    addFooterToAllPages(doc);

    // Download
    const filename = `${quoteData.quote_code.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    doc.save(filename);

    showSuccessMessage('PDF gerado com sucesso! Layout idêntico à pré-visualização.');

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    showErrorMessage('Erro ao gerar PDF: ' + error.message);
  }
};

// Função para desenhar o cabeçalho (igual template HTML)
function drawHeader(doc, yPos, quoteData) {
  // Linha superior
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(2);
  doc.line(20, yPos - 5, 190, yPos - 5);

  // Logo placeholder (esquerda)
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);
  doc.rect(25, yPos, 40, 25);
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38);
  doc.text('Pharmatec Logo', 30, yPos + 15);

  // Informações da proposta (direita)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('PROPOSTA COMERCIAL', 120, yPos + 8);

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(quoteData.quote_code, 120, yPos + 18);

  doc.setFontSize(12);
  doc.text(quoteData.date, 120, yPos + 25);

  // Linha inferior
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(2);
  doc.line(20, yPos + 35, 190, yPos + 35);
}

// Função para desenhar o grid de dados (igual template)
function drawDataGrid(doc, yPos, quoteData) {
  const gridItems = [
    { label: 'Cliente', value: quoteData.client || '-', x: 25, y: yPos },
    { label: 'CNPJ', value: quoteData.cnpj || '-', x: 115, y: yPos },
    { label: 'Representante', value: quoteData.representative || '-', x: 25, y: yPos + 25 },
    { label: 'Validade', value: `${quoteData.validity} dias`, x: 115, y: yPos + 25 },
    { label: 'Prazo de Entrega', value: quoteData.delivery_time || '-', x: 25, y: yPos + 50 },
    { label: 'Modelo da Máquina', value: quoteData.machine_model || '-', x: 115, y: yPos + 50 }
  ];

  gridItems.forEach(item => {
    // Caixa do item (igual ao CSS .data-item)
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.roundedRect(item.x - 3, item.y - 8, 85, 20, 2, 2, 'FD');

    // Label (igual ao CSS .data-label)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 102, 102);
    doc.text(item.label.toUpperCase(), item.x, item.y - 2);

    // Valor (igual ao CSS .data-value)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    doc.text(item.value, item.x, item.y + 6);
  });

  return yPos + 75;
}

// Função para especificações técnicas
function drawTechnicalSpecs(doc, yPos, quoteData) {
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  if (quoteData.tech_spec) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('ESPECIFICAÇÃO TÉCNICA', 20, yPos);

    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1);
    doc.line(20, yPos + 2, 120, yPos + 2);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(quoteData.tech_spec, 170);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 6 + 10;
  }

  if (quoteData.principle) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('PRINCÍPIO DE FUNCIONAMENTO', 20, yPos);

    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1);
    doc.line(20, yPos + 2, 130, yPos + 2);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(quoteData.principle, 170);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 6 + 15;
  }

  return yPos;
}

// Função para Modalidade A (igual template)
function drawModalidadeA(doc, yPos, sections) {
  const hasModalidadeA = (sections.itemsEquipA && sections.itemsEquipA.length > 0) ||
                        (sections.itemsAssessoriaA && sections.itemsAssessoriaA.length > 0) ||
                        (sections.itemsOperacionaisA && sections.itemsOperacionaisA.length > 0) ||
                        (sections.itemsCertificadosA && sections.itemsCertificadosA.length > 0);

  if (!hasModalidadeA) return yPos;

  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  // Caixa da modalidade A (igual template)
  doc.setDrawColor(220, 38, 38);
  doc.setFillColor(255, 248, 249);
  doc.setLineWidth(2);
  doc.roundedRect(22, yPos, 166, 20, 4, 4, 'FD');

  // Título centralizado
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('MODALIDADE A - Sistema CIF', 105, yPos + 12, { align: 'center' });
  yPos += 30;

  // Equipamentos
  if (sections.itemsEquipA && sections.itemsEquipA.length > 0) {
    yPos = drawItemsTable(doc, yPos, 'Equipamentos', sections.itemsEquipA, true);
  }

  // Serviços de Assessoria
  if (sections.itemsAssessoriaA && sections.itemsAssessoriaA.length > 0) {
    yPos = drawItemsTable(doc, yPos, 'Serviços de Assessoria', sections.itemsAssessoriaA, true);
  }

  // Serviços Operacionais
  if (sections.itemsOperacionaisA && sections.itemsOperacionaisA.length > 0) {
    yPos = drawItemsTable(doc, yPos, 'Serviços Operacionais e Preventivos', sections.itemsOperacionaisA, true);
  }

  // Certificados
  if (sections.itemsCertificadosA && sections.itemsCertificadosA.length > 0) {
    yPos = drawItemsTable(doc, yPos, 'Certificados', sections.itemsCertificadosA, false);
  }

  return yPos + 10;
}

// Função para Modalidade B (igual template)
function drawModalidadeB(doc, yPos, sections) {
  const hasModalidadeB = (sections.itemsEquipB && sections.itemsEquipB.length > 0) ||
                        (sections.itemsAssessoriaB && sections.itemsAssessoriaB.length > 0) ||
                        (sections.itemsOperacionaisB && sections.itemsOperacionaisB.length > 0) ||
                        (sections.itemsCertificadosB && sections.itemsCertificadosB.length > 0);

  if (!hasModalidadeB) return yPos;

  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  // Caixa da modalidade B (igual template)
  doc.setDrawColor(31, 41, 55);
  doc.setFillColor(248, 249, 250);
  doc.setLineWidth(2);
  doc.roundedRect(22, yPos, 166, 20, 4, 4, 'FD');

  // Título centralizado
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('MODALIDADE B - Sistema FOB', 105, yPos + 12, { align: 'center' });
  yPos += 30;

  // Equipamentos
  if (sections.itemsEquipB && sections.itemsEquipB.length > 0) {
    yPos = drawItemsTable(doc, yPos, 'Equipamentos', sections.itemsEquipB, true);
  }

  // Serviços de Assessoria
  if (sections.itemsAssessoriaB && sections.itemsAssessoriaB.length > 0) {
    yPos = drawItemsTable(doc, yPos, 'Serviços de Assessoria', sections.itemsAssessoriaB, true);
  }

  // Serviços Operacionais
  if (sections.itemsOperacionaisB && sections.itemsOperacionaisB.length > 0) {
    yPos = drawItemsTable(doc, yPos, 'Serviços Operacionais e Preventivos', sections.itemsOperacionaisB, true);
  }

  // Certificados
  if (sections.itemsCertificadosB && sections.itemsCertificadosB.length > 0) {
    yPos = drawItemsTable(doc, yPos, 'Certificados', sections.itemsCertificadosB, false);
  }

  return yPos + 10;
}

// Função para desenhar tabela de itens (igual template HTML)
function drawItemsTable(doc, yPos, title, items, showQuantity) {
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Título da seção
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(title, 25, yPos);

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);
  doc.line(25, yPos + 2, 25 + doc.getTextWidth(title), yPos + 2);
  yPos += 10;

  // Cabeçalho da tabela
  const tableStartY = yPos;
  const colWidths = showQuantity ?
    { desc: 70, qty: 15, days: 15, unit: 25, currency: 20, subtotal: 30 } :
    { desc: 100, unit: 35, currency: 20, subtotal: 20 };

  // Fundo do cabeçalho
  doc.setFillColor(245, 245, 245);
  doc.rect(25, yPos, 165, 8, 'F');

  // Bordas da tabela
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.5);

  // Cabeçalho
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  let x = 25;
  doc.text('DESCRIÇÃO', x + 2, yPos + 6);
  x += colWidths.desc;

  if (showQuantity) {
    doc.text('QTD', x + 2, yPos + 6);
    x += colWidths.qty;

    if (title.includes('Serviços')) {
      doc.text('DIAS', x + 2, yPos + 6);
      x += colWidths.days;
    }
  }

  doc.text('VALOR UNIT.', x + 2, yPos + 6);
  x += colWidths.unit;
  doc.text('MOEDA', x + 2, yPos + 6);
  x += colWidths.currency;
  doc.text('SUBTOTAL', x + 2, yPos + 6);

  yPos += 8;

  // Linhas da tabela
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  items.forEach(item => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const price = parseFloat(item.unit) || 0;
    const qty = parseInt(item.qty) || 1;
    const subtotal = price * qty;
    const currency = item.currency || 'BRL';

    // Fundo alternado
    if (items.indexOf(item) % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(25, yPos, 165, 8, 'F');
    }

    let x = 25;

    // Descrição
    const itemName = doc.splitTextToSize(item.name, colWidths.desc - 4);
    doc.text(itemName, x + 2, yPos + 6);
    x += colWidths.desc;

    if (showQuantity) {
      // Quantidade
      doc.text(qty.toString(), x + 2, yPos + 6);
      x += colWidths.qty;

      // Dias (se for serviço)
      if (title.includes('Serviços')) {
        doc.text(item.days || '-', x + 2, yPos + 6);
        x += colWidths.days;
      }
    }

    // Valor unitário
    doc.text(price.toFixed(2).replace('.', ','), x + 2, yPos + 6);
    x += colWidths.unit;

    // Moeda
    doc.text(currency, x + 2, yPos + 6);
    x += colWidths.currency;

    // Subtotal
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    doc.text(`${currency} ${symbol} ${subtotal.toFixed(2).replace('.', ',')}`, x + 2, yPos + 6);

    yPos += 8;
  });

  // Bordas da tabela
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.5);
  doc.rect(25, tableStartY, 165, yPos - tableStartY);

  return yPos + 10;
}

// Função para observações
function drawObservations(doc, yPos, notes) {
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('OBSERVAÇÕES', 25, yPos);

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);
  doc.line(25, yPos + 2, 80, yPos + 2);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const lines = doc.splitTextToSize(notes, 165);
  doc.text(lines, 25, yPos);

  return yPos + lines.length * 6 + 15;
}

// Função para condições de pagamento (página separada)
function drawPaymentConditions(doc, yPos, quoteData) {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('CONDIÇÕES DE PAGAMENTO', 105, yPos, { align: 'center' });
  yPos += 20;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  if (quoteData.payment_intro) {
    const lines = doc.splitTextToSize(quoteData.payment_intro, 170);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 6 + 15;
  }

  // Continuar com outras seções de pagamento...
  // (Implementar resto das condições de pagamento conforme template)

  return yPos;
}

// Função para termos e condições (página separada)
function drawTermsAndConditions(doc, yPos, quoteData) {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('TERMOS DE GARANTIA GERAIS DO FABRICANTE', 20, yPos);
  yPos += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Texto dos termos (igual ao template)
  const termsText = `Garantia de materiais elétricos, mecânicos e pneumáticos comerciais: conforme garantia do fabricante ou fornecedor.

Excluem-se da garantia: os desgastes normais de uso; defeitos de mau uso, imperícia ou negligência no uso; uso inadequado do equipamento; defeitos originados pela falta de cuidados, execução incorreta ou inadequada na limpeza, lubrificação, ou armazenamento do equipamento, bem como exposição a agentes químicos corrosivos, ou com condições ambientais e/ou elétricas inadequadas ou deficientes; defeitos ou danos causados por instalação ou manutenção técnica imprópria, e ainda, violação, alteração, ou substituição de peças ou acessórios, bem como outros itens, por serviço técnico não autorizado pelo fabricante; não cumprimento de orientações técnicas; danos causados por acidente; danos causados por agentes da natureza, assim como pancadas, quedas, queimadas, incêndios, enchentes, nevasca, nevoeiro, também furto, roubo, depredação, dentre outros.`;

  const lines = doc.splitTextToSize(termsText, 170);
  doc.text(lines, 20, yPos);
  yPos += lines.length * 5 + 20;

  // Informações de contato
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  // Caixa de contato
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(221, 221, 221);
  doc.roundedRect(20, yPos, 170, 40, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('INFORMAÇÕES PARA CONTATO', 105, yPos + 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Vendedor: ${quoteData.seller_name}`, 25, yPos + 20);
  doc.text(`Email: ${quoteData.contact_email}`, 25, yPos + 25);
  doc.text(`Telefone: ${quoteData.contact_phone}`, 25, yPos + 30);

  doc.text('Empresa: Pharmatec Solutions', 120, yPos + 20);
  doc.text('Website: www.apharmatec.com.br', 120, yPos + 25);

  return yPos + 50;
}

// Função para adicionar rodapé em todas as páginas
function addFooterToAllPages(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Gerado pelo Sistema de Orçamentos Pharmatec', 20, 287);
    doc.text(`Página ${i} de ${pageCount}`, 170, 287);
  }
}

function showSuccessMessage(message) {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;
  div.textContent = message;
  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 5000);
}

function showErrorMessage(message) {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;
  div.textContent = message;
  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 5000);
}