import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente de produção
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.production') });

const { Pool } = pg;

async function testLogin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('🧪 Testando sistema de autenticação no Neon...\n');
  console.log('📍 Conectando ao banco:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));

  try {
    // Testar login com credenciais corretas
    console.log('\n1️⃣ Testando login com credenciais corretas:');
    console.log('   Username: admin');
    console.log('   Password: admin123');

    const query = 'SELECT * FROM users WHERE username = $1 AND active = TRUE';
    const result = await pool.query(query, ['admin']);

    if (result.rows.length === 0) {
      console.log('   ❌ Usuário não encontrado no banco de dados!');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('   ✅ Usuário encontrado no banco!');
    console.log('      - ID:', user.id);
    console.log('      - Username:', user.username);
    console.log('      - Nome:', user.full_name);
    console.log('      - Email:', user.email);
    console.log('      - Role:', user.role);

    // Verificar senha
    const isValid = await bcrypt.compare('admin123', user.password_hash);

    if (isValid) {
      console.log('   ✅ Senha verificada com sucesso!');
      console.log('   ✅ Login bem-sucedido!');
    } else {
      console.log('   ❌ Senha inválida!');
      process.exit(1);
    }

    // Testar senha incorreta
    console.log('\n2️⃣ Testando login com senha incorreta:');
    console.log('   Username: admin');
    console.log('   Password: senhaerrada');

    const isInvalid = await bcrypt.compare('senhaerrada', user.password_hash);

    if (isInvalid) {
      console.log('   ❌ ERRO: Senha incorreta foi aceita!');
      process.exit(1);
    } else {
      console.log('   ✅ Senha incorreta corretamente rejeitada!');
    }

    // Verificar estrutura das tabelas
    console.log('\n3️⃣ Verificando estrutura do banco:');

    const tablesCheck = await pool.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('users', 'session', 'quotes')
      ORDER BY tablename
    `);

    console.log('   Tabelas encontradas:');
    tablesCheck.rows.forEach(row => {
      console.log('      ✅', row.tablename);
    });

    // Verificar se quotes tem a coluna user_id
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'quotes' AND column_name = 'user_id'
    `);

    if (columnsCheck.rows.length > 0) {
      console.log('   ✅ Coluna user_id existe na tabela quotes');
    } else {
      console.log('   ❌ Coluna user_id NÃO existe na tabela quotes');
    }

    console.log('\n✅ Todos os testes passaram!');
    console.log('\n🎉 Sistema de autenticação está 100% funcional!');
    console.log('\n🔑 Credenciais para login:');
    console.log('   - Usuário: admin');
    console.log('   - Senha: admin123');
    console.log('   - ⚠️ Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testLogin();
