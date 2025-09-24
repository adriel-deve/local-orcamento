import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'orcamentos';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('schema.sql não encontrado em db/');
  }
  const rawSql = fs.readFileSync(schemaPath, 'utf8');
  // Garante que o CREATE DATABASE/USE use o nome do .env
  const sql = rawSql
    .replace(/CREATE DATABASE IF NOT EXISTS `[^`]+`/i, `CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    .replace(/USE `[^`]+`/i, `USE \`${dbName}\``);

  console.log(`Conectando ao MySQL em ${host}:${port} como ${user}...`);
  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  try {
    console.log('Aplicando schema...');
    await conn.query(sql);
    console.log('Schema aplicado com sucesso para DB:', dbName);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Falha ao inicializar DB:', err.message);
  process.exit(1);
});
