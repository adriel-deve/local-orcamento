import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_DATABASE_URL = 'postgresql://neondb_owner:npg_nk0EB9PqrCQV@ep-ancient-voice-adoo5ffm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const connectionString = process.env.DATABASE_URL || FALLBACK_DATABASE_URL;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL não definida. Usando string de fallback local.');
}

if (!connectionString) {
  console.error('DATABASE_URL não definido. Configure a variável de ambiente antes de executar o script.');
  process.exit(1);
}

const schemaPath = path.join(__dirname, 'setup-neon-tables.sql');

function buildStatements(sql) {
  const statements = [];
  let buffer = '';

  sql.split(/\r?\n/).forEach(rawLine => {
    const line = rawLine.trim();
    if (!line || line.startsWith('--') || line.startsWith('\\')) {
      return;
    }

    buffer += rawLine + '\n';
    if (line.endsWith(';')) {
      statements.push(buffer.trim());
      buffer = '';
    }
  });

  if (buffer.trim().length > 0) {
    statements.push(buffer.trim());
  }

  return statements;
}

function describeStatement(sql) {
  const keyword = sql.split(/\s+/)[0]?.toUpperCase() || 'SQL';
  const preview = sql.replace(/\s+/g, ' ').slice(0, 60);
  return `${keyword} ${preview}...`;
}

async function setupNeonDatabase() {
  console.log('Conectando ao banco Neon...');
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('sslmode=') ? { rejectUnauthorized: false } : undefined
  });

  try {
    await client.connect();
    console.log('Conexão estabelecida.');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Arquivo de schema não encontrado em ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = buildStatements(schemaSql);

    console.log(`Executando ${statements.length} comandos SQL...`);

    for (const statement of statements) {
      const label = describeStatement(statement);
      try {
        const result = await client.query(statement);
        const keyword = statement.split(/\s+/)[0]?.toUpperCase() || 'SQL';
        if (keyword === 'SELECT') {
          console.log(`[OK] ${label}`);
          if (result.rows.length && result.rows.length <= 3) {
            console.log('     ->', result.rows);
          }
        } else {
          console.log(`[OK] ${label} (linhas afetadas: ${result.rowCount ?? 0})`);
        }
      } catch (error) {
        if (['42P07', '42710'].includes(error.code) || /already exists/i.test(error.message)) {
          console.warn(`[INFO] ${label} ignorado (já existe).`);
        } else if (['42704', '42P01'].includes(error.code) || /does not exist/i.test(error.message)) {
          console.warn(`[INFO] ${label} ignorado (não existe).`);
        } else {
          console.error(`[ERRO] ${label}`);
          console.error('       ->', error.message);
        }
      }
    }

    console.log('Resumo das tabelas públicas:');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    for (const row of tables.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*)::int AS total FROM "${row.table_name}"`);
        console.log(`   - ${row.table_name}: ${countResult.rows[0].total}`);
      } catch (error) {
        console.warn(`   - ${row.table_name}: não foi possível contar (${error.message})`);
      }
    }

    console.log('Configuração concluída.');
  } catch (error) {
    console.error('Falha ao configurar banco:', error.message);
  } finally {
    await client.end();
  }
}

setupNeonDatabase();
