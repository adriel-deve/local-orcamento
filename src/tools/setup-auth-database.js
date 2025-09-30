import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.production') });

const { Pool } = pg;

async function setupAuthDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Conectando ao banco de dados Neon...');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', '..', 'db', 'COPIAR-E-COLAR-NO-NEON.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executando script SQL...\n');

    // Executar o script SQL
    const result = await pool.query(sql);

    console.log('✅ Script executado com sucesso!');
    console.log('\nResultado:', result.rows);

    // Verificar se o usuário admin foi criado
    const userCheck = await pool.query("SELECT username, full_name, role FROM users WHERE username = 'admin'");

    if (userCheck.rows.length > 0) {
      console.log('\n✅ Usuário administrador criado:');
      console.log('   Username:', userCheck.rows[0].username);
      console.log('   Nome:', userCheck.rows[0].full_name);
      console.log('   Role:', userCheck.rows[0].role);
      console.log('\n🔐 Credenciais de acesso:');
      console.log('   Usuário: admin');
      console.log('   Senha: admin123');
      console.log('   ⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    }

    // Verificar tabelas criadas
    const tablesCheck = await pool.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('users', 'session')
      ORDER BY tablename
    `);

    console.log('\n📋 Tabelas criadas:');
    tablesCheck.rows.forEach(row => {
      console.log('   -', row.tablename);
    });

  } catch (error) {
    console.error('❌ Erro ao executar script:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupAuthDatabase();
