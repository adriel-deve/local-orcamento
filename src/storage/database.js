import pool from '../db.js';

export async function initDatabase() {
  try {
    await pool.execute('SELECT 1');
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function saveQuoteAndSpecs({ quote, specs }) {
  try {
    // Inserir or atualizar cotação
    const insertQuoteQuery = `
      INSERT INTO quotes (quote_code, date, company, representative, supplier, services, validity_days, delivery_time, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (quote_code)
      DO UPDATE SET
        date = EXCLUDED.date,
        company = EXCLUDED.company,
        representative = EXCLUDED.representative,
        supplier = EXCLUDED.supplier,
        services = EXCLUDED.services,
        validity_days = EXCLUDED.validity_days,
        delivery_time = EXCLUDED.delivery_time,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const [quoteResult] = await pool.execute(insertQuoteQuery, [
      quote.quote_code,
      quote.date || new Date().toISOString().split('T')[0],
      quote.company || '',
      quote.representative || '',
      quote.supplier || '',
      quote.services || '',
      parseInt(quote.validity_days) || 15,
      quote.delivery_time || null,
      quote.notes || null,
      quote.status || 'Rascunho'
    ]);

    const quoteId = quoteResult[0]?.id || quoteResult.insertId;

    // Deletar specs e items existentes
    await pool.execute('DELETE FROM items WHERE quote_id = $1', [quoteId]);
    await pool.execute('DELETE FROM specs WHERE quote_id = $1', [quoteId]);

    // Inserir specs e items
    for (let i = 0; i < (specs || []).length; i++) {
      const spec = specs[i];

      // Inserir spec
      await pool.execute(
        'INSERT INTO specs (quote_id, spec_index, description, image_path) VALUES ($1, $2, $3, $4)',
        [quoteId, i, spec.description || '', spec.image_path || null]
      );

      // Inserir items da spec
      for (const item of spec.items || []) {
        await pool.execute(
          'INSERT INTO items (quote_id, spec_index, name, price) VALUES ($1, $2, $3, $4)',
          [quoteId, i, item.name || '', parseFloat(item.price) || 0]
        );
      }
    }

    return { quoteId, success: true };

  } catch (error) {
    console.error('Error saving quote:', error);
    throw error;
  }
}

export async function getQuoteByCode(code) {
  try {
    // Buscar cotação
    const [quoteRows] = await pool.execute(
      'SELECT * FROM quotes WHERE quote_code = $1',
      [code]
    );

    if (!quoteRows || quoteRows.length === 0) {
      return null;
    }

    const quote = quoteRows[0];

    // Buscar specs
    const [specRows] = await pool.execute(
      'SELECT * FROM specs WHERE quote_id = $1 ORDER BY spec_index',
      [quote.id]
    );

    // Buscar items para cada spec
    const specs = [];
    for (const spec of specRows || []) {
      const [itemRows] = await pool.execute(
        'SELECT * FROM items WHERE quote_id = $1 AND spec_index = $2',
        [quote.id, spec.spec_index]
      );

      specs.push({
        ...spec,
        items: (itemRows || []).map(item => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price) || 0,
          qty: 1,
          currency: 'BRL'
        }))
      });
    }

    return { quote, specs };

  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }
}

export async function getAllQuotes() {
  try {
    const [rows] = await pool.execute(
      'SELECT quote_code, company, date, status, created_at FROM quotes ORDER BY created_at DESC'
    );
    return rows || [];
  } catch (error) {
    console.error('Error getting quotes:', error);
    throw error;
  }
}