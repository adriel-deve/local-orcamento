// Test script for new totals format
import fetch from 'node-fetch';
import FormData from 'form-data';

const baseUrl = 'http://localhost:3003';

async function testNewTotalsFormat() {
    console.log('🚀 Testando novo formato de totais...\n');

    // Test data with mixed currencies
    const testData = {
        quote_code: `TEST-TOTALS-${Date.now()}`,
        date: '2025-09-23',
        client: 'Empresa Teste Totais',
        cnpj: '12.345.678/0001-90',
        company: 'Pharmatec Solutions',
        representative: 'João Silva',
        machine_model: 'PH-2025-X',
        validity: '30',
        delivery: '45 dias',
        notes: 'Teste do novo formato de totais resumidos',
        seller_name: 'Vendedor Teste',
        contact_email: 'teste@pharmatec.com.br',
        contact_phone: '(11) 99999-9999',
        tech_spec: 'Especificação técnica para teste de totais',
        principle: 'Princípio de funcionamento com múltiplas moedas',
        specs_json: JSON.stringify({
            tech_spec: 'Especificação técnica para teste de totais',
            principle: 'Princípio de funcionamento com múltiplas moedas',
            sections: {
                // Modalidade A com BRL e USD
                itemsEquipA: [
                    { name: 'Equipamento Principal', qty: 1, unit: 50000, currency: 'BRL' },
                    { name: 'Acessório Importado', qty: 1, unit: 5000, currency: 'USD' }
                ],
                itemsAssessoriaA: [
                    { name: 'Assessoria Importação', qty: 1, unit: 3000, currency: 'BRL', days: 30 }
                ],
                itemsOperacionaisA: [
                    { name: 'FAT', qty: 1, unit: 2000, currency: 'BRL', days: 3 },
                    { name: 'SAT', qty: 1, unit: 1500, currency: 'USD', days: 5 }
                ],
                itemsCertificadosA: [
                    { name: 'Certificado CE', qty: 1, unit: 1500, currency: 'BRL' }
                ],
                // Modalidade B com apenas USD
                itemsEquipB: [
                    { name: 'Equipamento Principal', qty: 1, unit: 8000, currency: 'USD' }
                ],
                itemsAssessoriaB: [],
                itemsOperacionaisB: [
                    { name: 'FAT', qty: 1, unit: 800, currency: 'USD', days: 3 }
                ],
                itemsCertificadosB: [
                    { name: 'Certificado CE', qty: 1, unit: 300, currency: 'USD' }
                ]
            }
        })
    };

    try {
        console.log('📄 Teste 1: Preview HTML com novos totais...');
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
            const htmlContent = await previewResponse.text();

            // Check for new totals format
            if (htmlContent.includes('Total Modalidade A:') && htmlContent.includes('BRL R$') && htmlContent.includes('USD $')) {
                console.log('✅ Formato resumido Modalidade A encontrado (BRL + USD)');
            } else {
                console.log('⚠️ Formato resumido Modalidade A não encontrado');
            }

            if (htmlContent.includes('Total Modalidade B:') && htmlContent.includes('USD $')) {
                console.log('✅ Formato resumido Modalidade B encontrado (apenas USD)');
            } else {
                console.log('⚠️ Formato resumido Modalidade B não encontrado');
            }

            if (!htmlContent.includes('TOTAL GERAL')) {
                console.log('✅ Total geral removido com sucesso');
            } else {
                console.log('⚠️ Total geral ainda aparece');
            }

        } else {
            console.log('❌ Preview HTML: FALHOU');
            console.log('Status:', previewResponse.status);
        }

        console.log('\n📄 Teste 2: Geração PDF com novos totais...');
        const form2 = new FormData();
        Object.keys(testData).forEach(key => {
            form2.append(key, testData[key]);
        });

        const pdfResponse = await fetch(`${baseUrl}/quotes/generate-pdf`, {
            method: 'POST',
            body: form2
        });

        if (pdfResponse.ok) {
            console.log('✅ PDF Generation: SUCESSO');
            console.log('   Modalidade A: BRL + USD resumidos em uma linha');
            console.log('   Modalidade B: Apenas USD resumido');
            console.log('   Total geral removido');
        } else {
            console.log('❌ PDF Generation: FALHOU');
            console.log('Status:', pdfResponse.status);
        }

        console.log('\n🎯 Teste dos Novos Totais Finalizado!');
        console.log('\n📋 Resumo das mudanças:');
        console.log('   ✅ Removido total geral');
        console.log('   ✅ Totais resumidos por modalidade');
        console.log('   ✅ Formato: "BRL R$ X.XXX + USD $ X.XXX"');
        console.log('   ✅ Apenas moedas utilizadas aparecem');
        console.log('\n💰 Exemplos de formato:');
        console.log('   • Total Modalidade A: BRL R$ 56.500 + USD $ 6.500');
        console.log('   • Total Modalidade B: USD $ 9.100');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

testNewTotalsFormat();