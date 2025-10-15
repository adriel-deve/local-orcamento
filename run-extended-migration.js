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
    const sqlPath = path.join(process.cwd(), 'migrations', 'add-extended-settings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executando migração estendida...');
    await pool.query(sql);

    console.log('✅ Migração executada com sucesso!');
    console.log('✨ Novos campos de configuração adicionados.');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
