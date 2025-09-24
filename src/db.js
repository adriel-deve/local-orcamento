import dotenv from 'dotenv';
dotenv.config();

// Detectar tipo de banco baseado nas variáveis de ambiente
const usePostgreSQL = process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';

let pool;

if (usePostgreSQL) {
  // PostgreSQL (Neon)
  const { default: postgresPool } = await import('./db-postgres.js');
  pool = postgresPool;
} else {
  // MySQL (local)
  const mysql = await import('mysql2/promise');
  pool = mysql.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'orcamentos',
    connectionLimit: 10,
    namedPlaceholders: true,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

export default pool;
