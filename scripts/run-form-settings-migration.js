import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const { Client } = pg;

  // Conectar ao Neon usando DATABASE_URL
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando ao Neon PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'db', 'create-form-settings-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executando script SQL...');

    // Dividir por ponto-e-vírgula e executar cada statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`Executando statement ${i + 1}/${statements.length}...`);
          await client.query(statement);
        } catch (err) {
          // Ignorar erros de "já existe" ou "ON CONFLICT"
          if (err.message.includes('already exists') ||
              err.message.includes('duplicate key')) {
            console.log(`⚠️  Statement ${i + 1} pulado (já existe)`);
          } else {
            console.error(`❌ Erro no statement ${i + 1}:`, err.message);
          }
        }
      }
    }

    // Verificar quantas configurações foram inseridas
    const result = await client.query('SELECT COUNT(*) as count FROM form_settings');
    const count = result.rows[0].count;

    console.log('\n✅ Migração concluída com sucesso!');
    console.log(`📊 Total de configurações na tabela: ${count}`);

    // Listar as configurações de serviços
    const services = await client.query(
      "SELECT key, value FROM form_settings WHERE category = 'service_calc' ORDER BY key"
    );

    console.log('\n📋 Configurações de Serviços:');
    services.rows.forEach(row => {
      console.log(`   ${row.key}: ${row.value}`);
    });

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

runMigration();
