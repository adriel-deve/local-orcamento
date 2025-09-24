// PDF Generator - Igual à pré-visualização
window.generatePDFClient = function() {
  try {
    // Coletar dados do formulário
    if (collectPayload() === false) return;

    const formData = new FormData(document.getElementById('quoteForm'));
    const payload = JSON.parse(document.getElementById('specs_json').value || '{}');

    // Dados básicos (exatamente como na pré-visualização)
    const quoteData = {
      quote_code: formData.get('quote_code') || 'COT-' + Date.now(),
      date: formData.get('date') || new Date().toLocaleDateString('pt-BR'),
      company: formData.get('company') || '',
      representative: formData.get('representative') || '',
      client: formData.get('client') || '',
      cnpj: formData.get('cnpj') || '',
      validity_days: formData.get('validity') || '30',
      delivery_time: formData.get('delivery') || 'A definir',
      machine_model: formData.get('machine_model') || '',
      tech_spec: formData.get('tech_spec') || '',
      principle: formData.get('principle') || '',
      notes: formData.get('notes') || ''
    };

    // Criar PDF com layout idêntico à pré-visualização
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont('helvetica');

    // CABEÇALHO IDÊNTICO À PRÉ-VISUALIZAÇÃO
    // Layout exato do layout-print.ejs
    const headerHeight = 40;

    // Fundo do cabeçalho
    doc.setFillColor(248, 249, 250);
    doc.rect(10, 10, 190, headerHeight, 'F');

    // Linha superior vermelha
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(2);
    doc.line(10, 10, 200, 10);

    // Logo placeholder (esquerda)
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1);
    doc.rect(15, 15, 40, 25);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('LOGO', 30, 30);

    // Título da proposta (direita)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('PROPOSTA COMERCIAL', 120, 22);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(quoteData.quote_code, 120, 30);

    doc.setFontSize(12);
    doc.text(quoteData.date, 120, 37);

    // Linha inferior do cabeçalho
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(2);
    doc.line(10, 52, 200, 52);

    let yPos = 65;

    // DADOS DA PROPOSTA (Grid como na pré-visualização)
    doc.setFillColor(250, 250, 250);
    doc.rect(10, yPos - 5, 190, 35, 'F');

    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(1);

    // Grid 2x3 exato
    const gridItems = [
      { label: 'Cliente', value: quoteData.client || '-', x: 15, y: yPos },
      { label: 'CNPJ', value: quoteData.cnpj || '-', x: 110, y: yPos },
      { label: 'Representante', value: quoteData.representative || '-', x: 15, y: yPos + 10 },
      { label: 'Validade', value: `${quoteData.validity_days} dias`, x: 110, y: yPos + 10 },
      { label: 'Prazo de Entrega', value: quoteData.delivery_time || '-', x: 15, y: yPos + 20 },
      { label: 'Modelo da Máquina', value: quoteData.machine_model || '-', x: 110, y: yPos + 20 }
    ];

    gridItems.forEach(item => {
      // Caixa do item
      doc.rect(item.x - 3, item.y - 5, 85, 8);

      // Label (igual ao CSS .data-label)
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(102, 102, 102);
      doc.text(item.label.toUpperCase(), item.x, item.y - 1);

      // Valor (igual ao CSS .data-value)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.text(item.value, item.x, item.y + 3);
    });

    yPos += 40;

    // Dados organizados em grid (como na pré-visualização)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(196, 30, 58);

    doc.text('CLIENTE:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(quoteData.client, 50, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(196, 30, 58);
    doc.text('CNPJ:', 120, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(quoteData.cnpj, 140, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(196, 30, 58);
    doc.text('REPRESENTANTE:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(quoteData.representative, 70, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(196, 30, 58);
    doc.text('VALIDADE:', 120, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${quoteData.validity} dias`, 150, yPos);
    yPos += 15;

    // Seções de Itens (estilo pré-visualização)
    const sections = payload.sections || {};

    // Modalidade A - Caixa com borda vermelha
    if (sections.itemsEquipA && sections.itemsEquipA.length > 0) {
      // Desenhar caixa da modalidade
      doc.setDrawColor(196, 30, 58);
      doc.setFillColor(255, 248, 249); // Fundo muito claro vermelho
      doc.setLineWidth(2);
      doc.roundedRect(15, yPos - 5, 180, 8, 2, 2, 'FD');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(196, 30, 58);
      doc.text('MODALIDADE A - Sistema CIF', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      sections.itemsEquipA.forEach((item, index) => {
        if (yPos > 270) { // Nova página se necessário
          doc.addPage();
          yPos = 20;
        }

        const price = parseFloat(item.unit) || 0;
        const qty = parseInt(item.qty) || 1;
        const total = price * qty;
        const currency = item.currency || 'BRL';
        const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';

        doc.text(`${index + 1}. ${item.name}`, 25, yPos);
        yPos += 6;
        doc.text(`   Qtd: ${qty} | Unit: ${symbol} ${price.toFixed(2)} | Total: ${symbol} ${total.toFixed(2)}`, 25, yPos);
        yPos += 8;
      });
      yPos += 5;
    }

    // Modalidade A - Serviços
    if (sections.itemsAssessoriaA && sections.itemsAssessoriaA.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('MODALIDADE A - SERVIÇOS DE ASSESSORIA', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      sections.itemsAssessoriaA.forEach((item, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const price = parseFloat(item.unit) || 0;
        const currency = item.currency || 'BRL';
        const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';

        doc.text(`${index + 1}. ${item.name}`, 25, yPos);
        yPos += 6;
        doc.text(`   Valor: ${symbol} ${price.toFixed(2)}`, 25, yPos);
        yPos += 8;
      });
      yPos += 5;
    }

    // Modalidade B
    if (sections.itemsEquipB && sections.itemsEquipB.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55); // Cor cinza escuro
      doc.text('MODALIDADE B - EQUIPAMENTOS (FOB)', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      sections.itemsEquipB.forEach((item, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const price = parseFloat(item.unit) || 0;
        const qty = parseInt(item.qty) || 1;
        const total = price * qty;
        const currency = item.currency || 'BRL';
        const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';

        doc.text(`${index + 1}. ${item.name}`, 25, yPos);
        yPos += 6;
        doc.text(`   Qtd: ${qty} | Unit: ${symbol} ${price.toFixed(2)} | Total: ${symbol} ${total.toFixed(2)}`, 25, yPos);
        yPos += 8;
      });
      yPos += 5;
    }

    // Observações
    if (quoteData.notes) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(quoteData.notes, 170);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 5 + 10;
    }

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Gerado pelo Sistema Local Orçamentos', 20, 290);
      doc.text(`Página ${i} de ${pageCount}`, 160, 290);
    }

    // Download do PDF
    const filename = `${quoteData.quote_code.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    doc.save(filename);

    // Feedback para o usuário
    showSuccessMessage('PDF gerado com sucesso! O download iniciou automaticamente.');

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    showErrorMessage('Erro ao gerar PDF: ' + error.message);
  }
};

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