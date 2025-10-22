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

    console.log('📝 Executando migração para adicionar coluna equipment_images...');

    const migrationPath = path.join(__dirname, 'db', 'migrate-add-equipment-images.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    console.log('✅ Migração executada com sucesso!');
    console.log('✨ Coluna equipment_images adicionada à tabela quotes');

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
