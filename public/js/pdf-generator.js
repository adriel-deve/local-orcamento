// PDF Generator usando jsPDF - Funciona 100% na Vercel
window.generatePDFClient = function() {
  try {
    // Coletar dados do formulário
    if (collectPayload() === false) return;

    const formData = new FormData(document.getElementById('quoteForm'));
    const payload = JSON.parse(document.getElementById('specs_json').value || '{}');

    // Dados básicos do orçamento
    const quoteData = {
      quote_code: formData.get('quote_code') || 'COT-' + Date.now(),
      date: formData.get('date') || new Date().toLocaleDateString('pt-BR'),
      company: formData.get('company') || 'Empresa',
      representative: formData.get('representative') || '',
      client: formData.get('client') || '',
      cnpj: formData.get('cnpj') || '',
      validity: formData.get('validity') || '15',
      delivery: formData.get('delivery') || '',
      notes: formData.get('notes') || ''
    };

    // Criar PDF com jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configurar fonte
    doc.setFont('helvetica');

    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Cor azul
    doc.text('ORÇAMENTO', 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Linha decorativa
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2);
    doc.line(20, 25, 190, 25);

    let yPos = 40;

    // Informações básicas
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DA COTAÇÃO', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Código: ${quoteData.quote_code}`, 20, yPos);
    doc.text(`Data: ${quoteData.date}`, 120, yPos);
    yPos += 8;

    doc.text(`Cliente: ${quoteData.client}`, 20, yPos);
    yPos += 8;

    doc.text(`CNPJ: ${quoteData.cnpj}`, 20, yPos);
    yPos += 8;

    doc.text(`Empresa: ${quoteData.company}`, 20, yPos);
    yPos += 8;

    doc.text(`Representante: ${quoteData.representative}`, 20, yPos);
    yPos += 8;

    doc.text(`Validade: ${quoteData.validity} dias`, 20, yPos);
    doc.text(`Entrega: ${quoteData.delivery}`, 120, yPos);
    yPos += 15;

    // Seção de Itens
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ITENS COTADOS', 20, yPos);
    yPos += 10;

    const sections = payload.sections || {};

    // Modalidade A
    if (sections.itemsEquipA && sections.itemsEquipA.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Cor vermelha
      doc.text('MODALIDADE A - EQUIPAMENTOS (CIF)', 20, yPos);
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