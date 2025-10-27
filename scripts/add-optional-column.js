import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // Ler o arquivo SQL de migração
    const sqlPath = path.join(__dirname, '..', 'db', 'add-optional-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executando migração para adicionar coluna optional...');

    // Executar a migração
    await client.query(sql);

    console.log('✅ Migração executada com sucesso!');

    // Verificar a estrutura da tabela
    const result = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'items'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Estrutura atual da tabela items:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

runMigration().catch(console.error);
