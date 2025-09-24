// Test script for single currency totals
import fetch from 'node-fetch';
import FormData from 'form-data';

const baseUrl = 'http://localhost:3003';

async function testSingleCurrency() {
    console.log('🚀 Testando totais com uma única moeda...\n');

    const testData = {
        quote_code: `TEST-SINGLE-${Date.now()}`,
        date: '2025-09-23',
        client: 'Empresa Teste Moeda Única',
        cnpj: '12.345.678/0001-90',
        company: 'Pharmatec Solutions',
        representative: 'João Silva',
        machine_model: 'PH-2025-X',
        validity: '30',
        delivery: '45 dias',
        notes: 'Teste com apenas Real (BRL)',
        seller_name: 'Vendedor Teste',
        contact_email: 'teste@pharmatec.com.br',
        contact_phone: '(11) 99999-9999',
        tech_spec: 'Especificação técnica apenas em Real',
        principle: 'Funcionamento com moeda única',
        specs_json: JSON.stringify({
            tech_spec: 'Especificação técnica apenas em Real',
            principle: 'Funcionamento com moeda única',
            sections: {
                // Modalidade A apenas com BRL
                itemsEquipA: [
                    { name: 'Equipamento Nacional', qty: 1, unit: 50000, currency: 'BRL' }
                ],
                itemsAssessoriaA: [
                    { name: 'Consultoria Nacional', qty: 1, unit: 5000, currency: 'BRL', days: 15 }
                ],
                itemsOperacionaisA: [
                    { name: 'FAT', qty: 1, unit: 2000, currency: 'BRL', days: 3 },
                    { name: 'SAT', qty: 1, unit: 3000, currency: 'BRL', days: 5 }
                ],
                itemsCertificadosA: [],
                // Modalidade B também apenas BRL
                itemsEquipB: [
                    { name: 'Equipamento Nacional', qty: 1, unit: 45000, currency: 'BRL' }
                ],
                itemsAssessoriaB: [],
                itemsOperacionaisB: [
                    { name: 'FAT', qty: 1, unit: 2000, currency: 'BRL', days: 3 }
                ],
                itemsCertificadosB: []
            }
        })
    };

    try {
        console.log('📄 Testando preview com moeda única...');
        const form = new FormData();
        Object.keys(testData).forEach(key => {
            form.append(key, testData[key]);
        });

        const response = await fetch(`${baseUrl}/quotes/preview-html`, {
            method: 'POST',
            body: form
        });

        if (response.ok) {
            console.log('✅ Preview HTML: SUCESSO');
            const htmlContent = await response.text();

            // Check for proper single currency format
            const modalidadeAMatch = htmlContent.match(/Total Modalidade A:<\/span>\s*<span>([^<]+)<\/span>/);
            if (modalidadeAMatch && modalidadeAMatch[1].includes('BRL R$') && !modalidadeAMatch[1].includes(' + ')) {
                console.log('✅ Modalidade A: Apenas BRL sem símbolo "+"');
                console.log('   Formato:', modalidadeAMatch[1].trim());
            } else {
                console.log('⚠️ Formato Modalidade A incorreto');
                if (modalidadeAMatch) console.log('   Encontrado:', modalidadeAMatch[1]);
            }

            const modalidadeBMatch = htmlContent.match(/Total Modalidade B:<\/span>\s*<span>([^<]+)<\/span>/);
            if (modalidadeBMatch && modalidadeBMatch[1].includes('BRL R$') && !modalidadeBMatch[1].includes(' + ')) {
                console.log('✅ Modalidade B: Apenas BRL sem símbolo "+"');
                console.log('   Formato:', modalidadeBMatch[1].trim());
            } else {
                console.log('⚠️ Formato Modalidade B incorreto');
                if (modalidadeBMatch) console.log('   Encontrado:', modalidadeBMatch[1]);
            }

        } else {
            console.log('❌ Preview HTML: FALHOU');
        }

        console.log('\n🎯 Teste de Moeda Única Finalizado!');
        console.log('💰 Formato esperado: "BRL R$ 60.000" (sem +)');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

testSingleCurrency();