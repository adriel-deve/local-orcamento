import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Configuração para PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Adapter para compatibilidade com mysql2 interface
const adapter = {
  async execute(sql, params = []) {
    const client = await pool.connect();
    try {
      // Converter placeholders MySQL (:name) para PostgreSQL ($1, $2, ...)
      let pgSql = sql;
      let pgParams = params;

      if (Array.isArray(params)) {
        // Parâmetros posicionais
        pgParams = params;
      } else if (typeof params === 'object' && params !== null) {
        // Parâmetros nomeados - converter para posicionais
        pgParams = [];
        let paramIndex = 1;

        pgSql = sql.replace(/:(\w+)/g, (match, paramName) => {
          if (params[paramName] !== undefined) {
            pgParams.push(params[paramName]);
            return `$${paramIndex++}`;
          }
          return match;
        });
      }

      const result = await client.query(pgSql, pgParams);

      // Adaptar resultado para formato mysql2
      if (result.command === 'INSERT' && result.rows.length > 0) {
        // Para INSERT, retornar com insertId
        return [result.rows, {
          insertId: result.rows[0]?.id || null,
          affectedRows: result.rowCount || 0
        }];
      } else {
        // Para SELECT/UPDATE/DELETE, retornar os dados
        return [result.rows, {
          affectedRows: result.rowCount || 0
        }];
      }
    } finally {
      client.release();
    }
  },

  async query(sql, params = []) {
    return this.execute(sql, params);
  }
};

export default adapter;