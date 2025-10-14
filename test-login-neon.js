import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

async function testLogin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Testando login no banco Neon...\n');

    // 1. Verificar se tabela users existe
    console.log('1️⃣ Verificando tabela users...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      );
    `);
    console.log('   Tabela users existe:', tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela users não existe!');
      return;
    }

    // 2. Buscar usuário admin
    console.log('\n2️⃣ Buscando usuário admin...');
    const userQuery = 'SELECT * FROM users WHERE username = $1 AND active = TRUE';
    const userResult = await pool.query(userQuery, ['admin']);

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário admin não encontrado ou está inativo!');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Usuário encontrado:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Full Name:', user.full_name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.active);

    // 3. Testar senha
    console.log('\n3️⃣ Testando senha...');
    const password = 'admin123';
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (isValid) {
      console.log('✅ Senha correta!');
      console.log('\n✨ Login funcionaria com:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Senha incorreta!');
      console.log('   Tentando recriar usuário com senha correta...');

      const newHash = await bcrypt.hash('admin123', 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [newHash, 'admin']);
      console.log('✅ Senha atualizada com sucesso!');
    }

    // 4. Verificar tabela session
    console.log('\n4️⃣ Verificando tabela session...');
    const sessionCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'session'
      );
    `);
    console.log('   Tabela session existe:', sessionCheck.rows[0].exists);

    if (!sessionCheck.rows[0].exists) {
      console.log('⚠️  Tabela session não existe! Criando...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS session (
          sid VARCHAR NOT NULL PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        );
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);`);
      console.log('✅ Tabela session criada!');
    }

    console.log('\n✅ Todos os testes passaram! O login deve funcionar agora.');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  } finally {
    await pool.end();
  }
}

testLogin();
