import pool from '../db.js';
import { getSetting, updateSetting } from './settings-service.js';

const isPostgres = !!process.env.DATABASE_URL;

function convertPlaceholders(query) {
  if (!isPostgres) return query;
  let index = 1;
  return query.replace(/\?/g, () => `$${index++}`);
}

/**
 * Gera o próximo número de proposta baseado nas configurações
 * @returns {Promise<string>} Número da proposta formatado
 */
export async function generateQuoteNumber() {
  try {
    // Buscar configurações
    const typeSetting = await getSetting('quote_number_type');
    const prefixSetting = await getSetting('quote_number_prefix');
    const counterSetting = await getSetting('quote_number_counter');

    const type = typeSetting?.value || 'date';
    const prefix = prefixSetting?.value || '';

    if (type === 'date') {
      // Formato baseado em data: MMDDYY + contador do dia
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const year = String(today.getFullYear()).slice(-2);

      const datePrefix = `${month}${day}${year}`;

      // Buscar última proposta com este prefixo de data
      const query = convertPlaceholders(`
        SELECT quote_code
        FROM quotes
        WHERE quote_code LIKE ?
        ORDER BY quote_code DESC
        LIMIT 1
      `);

      const searchPattern = `${prefix}${datePrefix}%`;
      const [rows] = await pool.query(query, [searchPattern]);

      let counter = 1;
      if (rows && rows.length > 0) {
        const lastCode = rows[0].quote_code;
        // Extrair o contador do final
        const lastNumber = lastCode.replace(prefix + datePrefix, '');
        counter = parseInt(lastNumber) + 1 || 1;
      }

      return `${prefix}${datePrefix}${counter}`;

    } else {
      // Formato sequencial: Prefixo + contador global
      const counter = parseInt(counterSetting?.value || '1');
      const newNumber = `${prefix}${String(counter).padStart(6, '0')}`;

      // Atualizar contador
      await updateSetting('quote_number_counter', String(counter + 1), null);

      return newNumber;
    }
  } catch (error) {
    console.error('Erro ao gerar número da proposta:', error);
    // Fallback: usar timestamp
    return `PROP${Date.now()}`;
  }
}

/**
 * Verifica se um número de proposta já existe
 * @param {string} quoteCode
 * @returns {Promise<boolean>}
 */
export async function quoteNumberExists(quoteCode) {
  const query = convertPlaceholders('SELECT COUNT(*) as count FROM quotes WHERE quote_code = ?');
  const [rows] = await pool.query(query, [quoteCode]);
  return rows && rows[0] && parseInt(rows[0].count) > 0;
}
