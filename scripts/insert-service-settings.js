import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function insertServiceSettings() {
  const { Client } = pg;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando ao Neon PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    console.log('📝 Inserindo configurações de serviços...\n');

    const settings = [
      {
        category: 'service_calc',
        key: 'service_base_percent',
        value: '60.00',
        description: 'Percentual base sobre FOB para calcular valor total de serviços (%)'
      },
      {
        category: 'service_calc',
        key: 'service_nrs_percent',
        value: '45.00',
        description: 'Percentual de NRs sobre valor de serviços (%)'
      },
      {
        category: 'service_calc',
        key: 'service_nrs_text',
        value: 'Adaptações para as Normas NR 10, NR 12, com Laudo técnico e ART.',
        description: 'Texto padrão para serviço de NRs'
      },
      {
        category: 'service_calc',
        key: 'service_sat_percent',
        value: '26.00',
        description: 'Percentual de SAT sobre valor de serviços (%)'
      },
      {
        category: 'service_calc',
        key: 'service_sat_text',
        value: 'SAT (Startup feito por engenheiros Zanatec, e suporte de qualificação IQ/OQ e treinamento operacional ). Incluindo despesas.',
        description: 'Texto padrão para serviço de SAT'
      },
      {
        category: 'service_calc',
        key: 'service_garantia_percent',
        value: '13.00',
        description: 'Percentual de Garantia Extendida sobre valor de serviços (%)'
      },
      {
        category: 'service_calc',
        key: 'service_garantia_text',
        value: 'Garantia Nacional Extendida (12 meses) - Suporte técnico remoto ilimitado - Até 03 visitas técnicas emergenciais (sem custo de honorários, limitado a 05 dias úteis por visita) Relatório diagnóstico e recomendações',
        description: 'Texto padrão para Garantia Extendida'
      },
      {
        category: 'service_calc',
        key: 'service_preventiva_percent',
        value: '16.00',
        description: 'Percentual de Manutenção Preventiva sobre valor de serviços (%)'
      },
      {
        category: 'service_calc',
        key: 'service_preventiva_text',
        value: 'Plano de Manutenção Preventiva (12 meses) - 04 visitas programadas (trimestral) - Checklist completo de verificação - Validação de calibragem e ajustes Relatórios detalhados de condições e recomendações',
        description: 'Texto padrão para Manutenção Preventiva'
      }
    ];

    let inserted = 0;
    let updated = 0;

    for (const setting of settings) {
      try {
        // Tentar inserir, se já existir, atualizar
        const result = await client.query(`
          INSERT INTO form_settings (category, key, value, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (key) DO UPDATE
          SET category = EXCLUDED.category,
              value = EXCLUDED.value,
              description = EXCLUDED.description,
              updated_at = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS inserted
        `, [setting.category, setting.key, setting.value, setting.description]);

        if (result.rows[0].inserted) {
          console.log(`✓ Inserido: ${setting.key} = ${setting.value}`);
          inserted++;
        } else {
          console.log(`↻ Atualizado: ${setting.key} = ${setting.value}`);
          updated++;
        }
      } catch (err) {
        console.error(`❌ Erro ao processar ${setting.key}:`, err.message);
      }
    }

    console.log(`\n✅ Concluído!`);
    console.log(`   ${inserted} configurações inseridas`);
    console.log(`   ${updated} configurações atualizadas`);

    // Verificar o resultado
    const check = await client.query(`
      SELECT key, value
      FROM form_settings
      WHERE category = 'service_calc'
      ORDER BY key
    `);

    console.log(`\n📋 Configurações de service_calc (${check.rows.length} total):`);
    check.rows.forEach(row => {
      console.log(`   ${row.key}: ${row.value}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

insertServiceSettings();
