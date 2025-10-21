import dotenv from 'dotenv';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔄 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!');

    console.log('📝 Executando migração de aumento de limites de campos...');

    const migrationPath = path.join(__dirname, 'db', 'migrate-increase-field-limits.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    console.log('✅ Migração executada com sucesso!');
    console.log('✨ Limites de campos aumentados:');
    console.log('   - items.name: VARCHAR(1000)');
    console.log('   - quotes.company: VARCHAR(500)');
    console.log('   - quotes.client: VARCHAR(500)');
    console.log('   - quotes.representative: VARCHAR(500)');
    console.log('   - quotes.supplier: VARCHAR(500)');
    console.log('   - quotes.machine_model: VARCHAR(500)');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

runMigration().catch(err => {
  console.error('Falha na migração:', err);
  process.exit(1);
});
