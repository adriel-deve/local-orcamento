import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Connection string do Neon
const connectionString = 'postgresql://neondb_owner:npg_nk0EB9PqrCQV@ep-ancient-voice-adoo5ffm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function setupNeonDatabase() {
  const client = new Client({
    connectionString
  });

  try {
    console.log('🔄 Conectando ao banco Neon...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Ler o schema SQL
    const schemaPath = path.join(process.cwd(), 'db', 'schema-postgresql.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Executando schema SQL...');

    // Dividir em comandos individuais e executar
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const command of commands) {
      if (command.includes('CREATE') || command.includes('INSERT')) {
        try {
          await client.query(command);
          console.log(`✅ Executado: ${command.substring(0, 50)}...`);
        } catch (error) {
          // Ignorar erros de "já existe"
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Já existe: ${command.substring(0, 50)}...`);
          } else {
            console.error(`❌ Erro: ${error.message}`);
          }
        }
      }
    }

    // Testar inserção de dados de teste
    console.log('🔄 Testando inserção de dados...');

    const testQuery = `
      INSERT INTO quotes (quote_code, date, company, representative, supplier, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (quote_code) DO NOTHING
      RETURNING id
    `;

    const result = await client.query(testQuery, [
      'TEST-' + Date.now(),
      new Date().toISOString().split('T')[0],
      'Empresa Teste',
      'Representante Teste',
      'Fornecedor Teste',
      'Rascunho'
    ]);

    if (result.rows.length > 0) {
      console.log('✅ Dados de teste inseridos com sucesso!');
      console.log('📄 ID da cotação teste:', result.rows[0].id);
    }

    // Verificar tabelas criadas
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    const tablesResult = await client.query(tablesQuery);
    console.log('📋 Tabelas criadas:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Contar registros
    const countQuotes = await client.query('SELECT COUNT(*) as total FROM quotes');
    const countSpecs = await client.query('SELECT COUNT(*) as total FROM specs');
    const countItems = await client.query('SELECT COUNT(*) as total FROM items');

    console.log('📊 Estatísticas do banco:');
    console.log(`   - Quotes: ${countQuotes.rows[0].total}`);
    console.log(`   - Specs: ${countSpecs.rows[0].total}`);
    console.log(`   - Items: ${countItems.rows[0].total}`);

    console.log('\n🎉 Banco Neon configurado com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Configure a variável DATABASE_URL no Vercel');
    console.log('2. Faça o deploy no Vercel');
    console.log('3. Teste o sistema em produção');

  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error);
  } finally {
    await client.end();
  }
}

setupNeonDatabase();