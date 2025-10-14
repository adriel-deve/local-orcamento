import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Conectando ao banco de dados...');

    // Ler arquivo SQL
    const sqlPath = path.join(process.cwd(), 'migrations', 'create-settings-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executando migração...');
    await pool.query(sql);

    console.log('✅ Migração executada com sucesso!');
    console.log('✨ Tabela form_settings criada e valores padrão inseridos.');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
