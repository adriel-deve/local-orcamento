import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

async function createAdminUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Conectando ao banco de dados...');

    // Hash da senha
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Verificar se usuário já existe
    const checkQuery = 'SELECT * FROM users WHERE username = $1';
    const checkResult = await pool.query(checkQuery, ['admin']);

    if (checkResult.rows.length > 0) {
      console.log('✅ Usuário admin já existe!');
      console.log('Atualizando senha...');

      const updateQuery = 'UPDATE users SET password_hash = $1, active = TRUE WHERE username = $2';
      await pool.query(updateQuery, [passwordHash, 'admin']);

      console.log('✅ Senha do admin atualizada com sucesso!');
    } else {
      console.log('Criando usuário admin...');

      const insertQuery = `
        INSERT INTO users (username, password_hash, full_name, email, role, active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, username, full_name, email, role
      `;

      const result = await pool.query(insertQuery, [
        'admin',
        passwordHash,
        'Administrador',
        'admin@local-orcamentos.com',
        'admin',
        true
      ]);

      console.log('✅ Usuário admin criado com sucesso!');
      console.log('Dados:', result.rows[0]);
    }

    console.log('\n📋 Credenciais de login:');
    console.log('Username: admin');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createAdminUser();
