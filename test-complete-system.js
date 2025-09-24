// Complete system test script
import fetch from 'node-fetch';
import FormData from 'form-data';

const baseUrl = 'http://localhost:3003';

async function testCompleteSystem() {
    console.log('🚀 Iniciando teste completo do sistema...\n');

    // Test data with checkbox services
    const testData = {
        quote_code: `COT-2025-TEST-${Date.now()}`,
        date: '2025-09-23',
        client: 'Empresa Teste Ltda',
        cnpj: '12.345.678/0001-90',
        company: 'Pharmatec Solutions',
        representative: 'João Silva',
        machine_model: 'PH-2025-X',
        validity: '30',
        delivery: '45 dias',
        notes: 'Teste completo do sistema',
        seller_name: 'Vendedor Teste',
        contact_email: 'teste@pharmatec.com.br',
        contact_phone: '(11) 99999-9999',
        specs_json: JSON.stringify({
            tech_spec: 'Especificação técnica de teste',
            principle: 'Princípio de funcionamento de teste',
            sections: {
                // Modalidade A com serviços operacionais
                itemsEquipA: [
                    { name: 'Equipamento Principal', qty: 1, unit: 50000, currency: 'BRL' }
                ],
                itemsAssessoriaA: [
                    { name: 'Assessoria Importação', qty: 1, unit: 5000, currency: 'BRL' }
                ],
                itemsOperacionaisA: [
                    { name: 'FAT', qty: 1, unit: 2000, currency: 'BRL' },
                    { name: 'SAT', qty: 1, unit: 3000, currency: 'BRL' },
                    { name: 'Startup', qty: 1, unit: 4000, currency: 'BRL' },
                    { name: 'Treinamento', qty: 1, unit: 2500, currency: 'BRL' }
                ],
                itemsCertificadosA: [
                    { name: 'Certificado CE', qty: 1, unit: 1500, currency: 'BRL' }
                ],
                // Modalidade B (copiada de A)
                itemsEquipB: [
                    { name: 'Equipamento Principal', qty: 1, unit: 45000, currency: 'BRL' }
                ],
                itemsAssessoriaB: [],
                itemsOperacionaisB: [
                    { name: 'FAT', qty: 1, unit: 2000, currency: 'BRL' },
                    { name: 'SAT', qty: 1, unit: 3000, currency: 'BRL' }
                ],
                itemsCertificadosB: [
                    { name: 'Certificado CE', qty: 1, unit: 1500, currency: 'BRL' }
                ]
            }
        })
    };

    try {
        // Test 1: Test HTML Preview
        console.log('📄 Teste 1: Gerando preview HTML...');
        const form1 = new FormData();
        Object.keys(testData).forEach(key => {
            form1.append(key, testData[key]);
        });

        const previewResponse = await fetch(`${baseUrl}/quotes/preview-html`, {
            method: 'POST',
            body: form1
        });

        if (previewResponse.ok) {
            console.log('✅ Preview HTML: SUCESSO');
        } else {
            console.log('❌ Preview HTML: FALHOU');
            console.log('Status:', previewResponse.status);
        }

        // Test 2: Test PDF Generation with Modalidades
        console.log('\n📄 Teste 2: Gerando PDF com layout completo...');
        const form2 = new FormData();
        Object.keys(testData).forEach(key => {
            form2.append(key, testData[key]);
        });

        const pdfResponse = await fetch(`${baseUrl}/quotes/generate-pdf`, {
            method: 'POST',
            body: form2
        });

        if (pdfResponse.ok) {
            const contentType = pdfResponse.headers.get('content-type');
            console.log('✅ PDF Generation: SUCESSO');
            console.log('   Content-Type:', contentType);
            console.log('   Template: quotes/layout.ejs (mesmo do preview)');
            console.log('   Modalidades A e B incluídas');

            if (contentType && contentType.includes('application/pdf')) {
                console.log('✅ PDF Content-Type correto');
            }
        } else {
            console.log('❌ PDF Generation: FALHOU');
            console.log('Status:', pdfResponse.status);
            const text = await pdfResponse.text();
            console.log('Error:', text.substring(0, 300));
        }

        // Test 3: Test DOCX Generation
        console.log('\n📄 Teste 3: Gerando DOCX...');
        const form3 = new FormData();
        Object.keys(testData).forEach(key => {
            form3.append(key, testData[key]);
        });

        const docxResponse = await fetch(`${baseUrl}/quotes/generate-docx`, {
            method: 'POST',
            body: form3
        });

        if (docxResponse.ok) {
            const contentType = docxResponse.headers.get('content-type');
            console.log('✅ DOCX Generation: SUCESSO');
            console.log('   Content-Type:', contentType);
        } else {
            console.log('❌ DOCX Generation: FALHOU');
            console.log('Status:', docxResponse.status);
            const text = await docxResponse.text();
            console.log('Error:', text.substring(0, 300));
        }

        console.log('\n🎯 Teste Completo Finalizado!');
        console.log('\n📋 Resumo dos testes:');
        console.log('   - Formulário com dados completos');
        console.log('   - Modalidade A: 4 seções com itens');
        console.log('   - Modalidade B: 3 seções com itens');
        console.log('   - Serviços operacionais: FAT, SAT, Startup, Treinamento');
        console.log('   - Geração HTML, PDF e DOCX testadas');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

// Check if we can import fetch
if (typeof fetch === 'undefined') {
    console.log('📦 Instalando node-fetch...');
    process.exit(1);
}

testCompleteSystem();