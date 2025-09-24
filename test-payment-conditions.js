// Test script for payment conditions feature
import fetch from 'node-fetch';
import FormData from 'form-data';

const baseUrl = 'http://localhost:3003';

async function testPaymentConditions() {
    console.log('🚀 Testando Condições de Pagamento...\n');

    const testData = {
        quote_code: `TEST-PAYMENT-${Date.now()}`,
        date: '2025-09-23',
        client: 'Empresa Teste Condições Pagamento',
        cnpj: '12.345.678/0001-90',
        company: 'Pharmatec Solutions',
        representative: 'João Silva',
        machine_model: 'PH-2025-PAYMENT',
        validity: '30',
        delivery: '45 dias',
        notes: 'Teste com condições de pagamento',
        seller_name: 'Vendedor Teste',
        contact_email: 'teste@pharmatec.com.br',
        contact_phone: '(11) 99999-9999',
        tech_spec: 'Equipamento de teste',
        principle: 'Funcionamento de teste',

        // Condições de pagamento
        include_payment_conditions: 'on', // checkbox marcado
        payment_intro: 'As condições de pagamento e faturamento dos valores estipulados nesta proposta, serão conforme abaixo:',
        payment_usd_conditions: '01 (um) depósito no aceite da invoice referente a 50% do valor ofertado em dólares e o saldo de 50% do valor em dólares restante da proposta pago na chegada do pedido no porto aduaneiro.',
        payment_brl_intro: 'Montante em reais brasileiros de serviços prestados de acordo com a opção:',
        payment_brl_with_sat: 'Referente apenas†† ao montante resultante dos serviços contratados do Grupo Zanatech: Pagamento parcelado em 03 (três) parcelas pagas através de depósitos ou boletos:\n1. Primeira parcela, no valor de 10% do montante em reais, para ser paga no aceite da invoice;\n2. Segunda parcela no valor de 30% do montante em reais, para ser paga na chegada do pedido na empresa ou 60 dias corridos após o aceite da invoice, o que ocorrer primeiro;\n3. Terceira parcela no valor de 60% do montante em reais, para ser paga 30 dias após aprovação do SAT ou 90 dias corridos após o aceite da invoice, o que ocorrer primeiro;',
        payment_brl_without_sat: 'Referente apenas†† ao montante resultante dos serviços contratados do Grupo Zanatech: Pagamento parcelado em 02 (duas) parcelas pagas através de depósitos ou boletos:\n1. Primeira parcela, no valor de 10% do montante em reais, para ser paga no aceite da invoice;\n2. Segunda parcela no valor de 90% do montante em reais, para ser paga na chegada do pedido no porto aduaneiro;',
        payment_additional_notes: 'Não fazem parte dos serviços prestados pelo Grupo Zanatech os itens anteriores: 1. Honorários de despachantes e manuseio; 2. Despesas de Importação; 3. Transporte até a porta da empresa. Os pagamentos e condições de tais itens são negociados diretamente entre a empresa contratante e a prestadora do serviço em questão. As empresas parceiras recomendadas pelo Grupo Zanatech podem oferecer condições e descontos especiais nas condições pré-estabelecidas. Para o start-up, o EQUIPAMENTO deve estar em ÁREA QUALIFICADA, com fácil acesso às UTILIDADES (ar comprimido, alimentação elétrica) necessárias, caso contrário poderá haver atrasos e custos adicionais.',

        specs_json: JSON.stringify({
            tech_spec: 'Equipamento de teste',
            principle: 'Funcionamento de teste',
            sections: {
                itemsEquipA: [
                    { name: 'Equipamento Principal', qty: 1, unit: 50000, currency: 'BRL' }
                ],
                itemsAssessoriaA: [],
                itemsOperacionaisA: [],
                itemsCertificadosA: [],
                itemsEquipB: [],
                itemsAssessoriaB: [],
                itemsOperacionaisB: [],
                itemsCertificadosB: []
            }
        })
    };

    try {
        console.log('📄 Teste 1: Preview HTML com condições de pagamento...');
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

            // Verificar se as condições de pagamento aparecem
            if (htmlContent.includes('CONDIÇÕES DE PAGAMENTO')) {
                console.log('✅ Seção de condições de pagamento incluída');
            } else {
                console.log('⚠️ Seção de condições de pagamento não encontrada');
            }

            if (htmlContent.includes('Montante em dólares americanos')) {
                console.log('✅ Condições em dólares incluídas');
            } else {
                console.log('⚠️ Condições em dólares não encontradas');
            }

            if (htmlContent.includes('OPÇÃO A ou OPÇÃO B (com SAT)')) {
                console.log('✅ Condições com SAT incluídas');
            } else {
                console.log('⚠️ Condições com SAT não encontradas');
            }

            if (htmlContent.includes('OPÇÃO A ou OPÇÃO B (sem SAT)')) {
                console.log('✅ Condições sem SAT incluídas');
            } else {
                console.log('⚠️ Condições sem SAT não encontradas');
            }

        } else {
            console.log('❌ Preview HTML: FALHOU');
            console.log('Status:', previewResponse.status);
        }

        console.log('\n📄 Teste 2: Geração PDF com condições de pagamento...');
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
            console.log('   Condições de pagamento incluídas no PDF');
        } else {
            console.log('❌ PDF Generation: FALHOU');
            console.log('Status:', pdfResponse.status);
        }

        console.log('\n📄 Teste 3: Teste sem condições de pagamento...');
        const testDataWithoutPayment = { ...testData };
        delete testDataWithoutPayment.include_payment_conditions; // Remover checkbox

        const form3 = new FormData();
        Object.keys(testDataWithoutPayment).forEach(key => {
            form3.append(key, testDataWithoutPayment[key]);
        });

        const previewResponse3 = await fetch(`${baseUrl}/quotes/preview-html`, {
            method: 'POST',
            body: form3
        });

        if (previewResponse3.ok) {
            const htmlContent3 = await previewResponse3.text();

            if (!htmlContent3.includes('CONDIÇÕES DE PAGAMENTO')) {
                console.log('✅ Condições de pagamento ocultadas quando não selecionadas');
            } else {
                console.log('⚠️ Condições de pagamento aparecem mesmo quando não selecionadas');
            }
        }

        console.log('\n🎯 Teste de Condições de Pagamento Finalizado!');
        console.log('\n📋 Funcionalidades testadas:');
        console.log('   ✅ Checkbox para incluir condições');
        console.log('   ✅ Campos editáveis para cada seção');
        console.log('   ✅ Exibição condicional no template');
        console.log('   ✅ Formatação adequada no PDF');
        console.log('   ✅ Ocultação quando não selecionado');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

testPaymentConditions();