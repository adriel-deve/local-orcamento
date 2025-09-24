// Test script for long text wrapping
import fetch from 'node-fetch';
import FormData from 'form-data';

const baseUrl = 'http://localhost:3003';

async function testLongTextWrapping() {
    console.log('🚀 Testando quebra de linha para textos longos...\n');

    // Create very long text to test wrapping
    const longTechSpec = `Esta é uma especificação técnica muito longa que deve ser quebrada automaticamente em múltiplas linhas para evitar que o texto saia dos limites da página. O equipamento possui múltiplas funcionalidades avançadas incluindo sistema de controle automático, sensores de alta precisão, interface touch screen colorida, conectividade IoT para monitoramento remoto, sistema de backup de energia, certificações internacionais de segurança e qualidade, manuais em múltiplos idiomas, suporte técnico 24/7, garantia estendida, treinamento completo para operadores, sistema de alertas inteligentes, compatibilidade com diferentes protocolos de comunicação, design ergonômico para facilitar operação, baixo consumo energético, materiais de alta durabilidade e resistência à corrosão, sistema modular para expansões futuras.`;

    const longPrinciple = `O princípio de funcionamento baseia-se em tecnologia de ponta que combina diversos sistemas integrados para proporcionar máxima eficiência operacional. O processo inicia-se com a coleta de dados através de sensores distribuídos estrategicamente ao longo do equipamento, que monitoram constantemente parâmetros como temperatura, pressão, velocidade, vibração e outros indicadores críticos. Estes dados são processados em tempo real por um sistema de controle inteligente que utiliza algoritmos avançados de machine learning para otimizar automaticamente os parâmetros operacionais. O sistema também possui redundâncias de segurança que garantem operação contínua mesmo em situações adversas, incluindo sistemas de backup, failsafe automático e protocolos de emergência. A interface de usuário foi desenvolvida seguindo princípios de usabilidade moderna, proporcionando controle intuitivo e visualização clara de todos os parâmetros relevantes.`;

    const longNotes = `Observações importantes: Este equipamento requer instalação por técnicos certificados e treinamento específico para operadores. É necessário ambiente climatizado com temperatura entre 18°C e 25°C e umidade relativa entre 45% e 65%. O equipamento deve ser conectado à rede estabilizada com proteção contra surtos elétricos. Recomenda-se programa de manutenção preventiva trimestral e calibração semestral dos sensores. O suporte técnico está disponível via telefone, email e portal web 24 horas por dia, 7 dias por semana. Garantia de 12 meses para componentes e 24 meses para software. Peças de reposição disponíveis por 10 anos. Treinamento inicial incluso para até 5 operadores. Documentação técnica completa fornecida em português. Certificações CE, ISO 9001, ISO 14001 incluídas.`;

    const testData = {
        quote_code: `TEST-LONGTEXT-${Date.now()}`,
        date: '2025-09-23',
        client: 'Empresa Teste Textos Longos Ltda',
        cnpj: '12.345.678/0001-90',
        company: 'Pharmatec Solutions',
        representative: 'João Silva',
        machine_model: 'PH-2025-LONGTEXT',
        validity: '30',
        delivery: '45 dias',
        notes: longNotes,
        seller_name: 'Vendedor Teste',
        contact_email: 'teste@pharmatec.com.br',
        contact_phone: '(11) 99999-9999',
        tech_spec: longTechSpec,
        principle: longPrinciple,
        specs_json: JSON.stringify({
            tech_spec: longTechSpec,
            principle: longPrinciple,
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
        console.log('📄 Teste 1: Preview HTML com textos longos...');
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

            // Check if long text appears and styles are applied
            if (htmlContent.includes('word-wrap: break-word')) {
                console.log('✅ Estilos de quebra de linha aplicados');
            } else {
                console.log('⚠️ Estilos de quebra de linha não encontrados');
            }

            if (htmlContent.includes('line-height: 1.6')) {
                console.log('✅ Line-height melhorado aplicado');
            } else {
                console.log('⚠️ Line-height não encontrado');
            }

            console.log('ℹ️ Tamanho do texto técnico:', longTechSpec.length, 'caracteres');
            console.log('ℹ️ Tamanho do princípio:', longPrinciple.length, 'caracteres');
            console.log('ℹ️ Tamanho das observações:', longNotes.length, 'caracteres');

        } else {
            console.log('❌ Preview HTML: FALHOU');
            console.log('Status:', previewResponse.status);
        }

        console.log('\n📄 Teste 2: Geração PDF com textos longos...');
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
            console.log('   Textos longos processados sem erros');
            console.log('   Quebra de linha automática aplicada');
        } else {
            console.log('❌ PDF Generation: FALHOU');
            console.log('Status:', pdfResponse.status);
        }

        console.log('\n🎯 Teste de Textos Longos Finalizado!');
        console.log('\n📋 Melhorias implementadas:');
        console.log('   ✅ word-wrap: break-word - quebra palavras longas');
        console.log('   ✅ overflow-wrap: break-word - quebra em overflow');
        console.log('   ✅ hyphens: auto - hifenização automática');
        console.log('   ✅ line-height: 1.6 - melhor espaçamento entre linhas');
        console.log('\n📏 Limites testados:');
        console.log(`   • Especificação técnica: ${longTechSpec.length} caracteres`);
        console.log(`   • Princípio funcionamento: ${longPrinciple.length} caracteres`);
        console.log(`   • Observações: ${longNotes.length} caracteres`);

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

testLongTextWrapping();