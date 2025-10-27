import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkSettings() {
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

    // Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'form_settings'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela form_settings não existe!');
      return;
    }

    console.log('✅ Tabela form_settings existe!\n');

    // Contar total de configurações
    const count = await client.query('SELECT COUNT(*) as count FROM form_settings');
    console.log(`📊 Total de configurações: ${count.rows[0].count}\n`);

    // Listar configurações por categoria
    const categories = await client.query(`
      SELECT category, COUNT(*) as count
      FROM form_settings
      GROUP BY category
      ORDER BY category
    `);

    console.log('📋 Configurações por categoria:');
    categories.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.count} configurações`);
    });

    // Listar configurações de serviços
    const services = await client.query(`
      SELECT key, value, description
      FROM form_settings
      WHERE category = 'service_calc'
      ORDER BY key
    `);

    console.log('\n🔧 Configurações de Serviços (service_calc):');
    if (services.rows.length === 0) {
      console.log('   ⚠️  Nenhuma configuração de serviço encontrada!');
    } else {
      services.rows.forEach(row => {
        console.log(`   ✓ ${row.key} = ${row.value}`);
        if (row.description) {
          console.log(`     (${row.description})`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

checkSettings();
