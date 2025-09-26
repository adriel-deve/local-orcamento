import pg from 'pg';

const { Client } = pg;

// Connection string do Neon
const connectionString = 'postgresql://neondb_owner:npg_nk0EB9PqrCQV@ep-ancient-voice-adoo5ffm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function updateNeonColumns() {
  const client = new Client({
    connectionString
  });

  try {
    console.log('🔄 Conectando ao banco Neon...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    console.log('🔄 Adicionando colunas que estão faltando...');

    // Adicionar colunas na tabela quotes
    const alterQuotesCommands = [
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client VARCHAR(255) DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS cnpj VARCHAR(20) DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS machine_model VARCHAR(255) DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tech_spec TEXT DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS principle TEXT DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50) DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255) DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS equipment_image VARCHAR(512) DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS include_payment_conditions BOOLEAN DEFAULT FALSE',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_intro TEXT DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_usd_conditions TEXT DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_brl_intro TEXT DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_brl_with_sat TEXT DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_brl_without_sat TEXT DEFAULT NULL',
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_additional_notes TEXT DEFAULT NULL'
    ];

    // Adicionar colunas na tabela items
    const alterItemsCommands = [
      'ALTER TABLE items ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1',
      'ALTER TABLE items ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT \'BRL\'',
      'ALTER TABLE items ADD COLUMN IF NOT EXISTS days INTEGER DEFAULT NULL'
    ];

    // Executar todas as alterações
    const allCommands = [...alterQuotesCommands, ...alterItemsCommands];

    for (const command of allCommands) {
      try {
        await client.query(command);
        console.log(`✅ Executado: ${command.substring(0, 50)}...`);
      } catch (error) {
        console.log(`⚠️  Já existe ou erro: ${command.substring(0, 50)}...`);
      }
    }

    console.log('🔄 Verificando estrutura das tabelas...');

    // Verificar colunas da tabela quotes
    const quotesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'quotes'
      ORDER BY ordinal_position
    `);

    console.log('📋 Colunas da tabela quotes:');
    quotesColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar colunas da tabela items
    const itemsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'items'
      ORDER BY ordinal_position
    `);

    console.log('📋 Colunas da tabela items:');
    itemsColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    console.log('\n🎉 Estrutura do banco atualizada com sucesso!');
    console.log('✅ Agora o sistema pode salvar todas as informações corretamente!');

  } catch (error) {
    console.error('❌ Erro ao atualizar colunas:', error);
  } finally {
    await client.end();
  }
}

updateNeonColumns();