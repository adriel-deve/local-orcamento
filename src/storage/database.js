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
      INSERT INTO quotes (quote_code, date, company, client, cnpj, machine_model, tech_spec, principle,
                         representative, supplier, services, validity_days, delivery_time, notes, status,
                         contact_email, contact_phone, seller_name, equipment_image, include_payment_conditions,
                         payment_intro, payment_usd_conditions, payment_brl_intro, payment_brl_with_sat,
                         payment_brl_without_sat, payment_additional_notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      ON CONFLICT (quote_code)
      DO UPDATE SET
        date = EXCLUDED.date,
        company = EXCLUDED.company,
        client = EXCLUDED.client,
        cnpj = EXCLUDED.cnpj,
        machine_model = EXCLUDED.machine_model,
        tech_spec = EXCLUDED.tech_spec,
        principle = EXCLUDED.principle,
        representative = EXCLUDED.representative,
        supplier = EXCLUDED.supplier,
        services = EXCLUDED.services,
        validity_days = EXCLUDED.validity_days,
        delivery_time = EXCLUDED.delivery_time,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        seller_name = EXCLUDED.seller_name,
        equipment_image = EXCLUDED.equipment_image,
        include_payment_conditions = EXCLUDED.include_payment_conditions,
        payment_intro = EXCLUDED.payment_intro,
        payment_usd_conditions = EXCLUDED.payment_usd_conditions,
        payment_brl_intro = EXCLUDED.payment_brl_intro,
        payment_brl_with_sat = EXCLUDED.payment_brl_with_sat,
        payment_brl_without_sat = EXCLUDED.payment_brl_without_sat,
        payment_additional_notes = EXCLUDED.payment_additional_notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const [quoteResult] = await pool.execute(insertQuoteQuery, [
      quote.quote_code,
      quote.date || new Date().toISOString().split('T')[0],
      quote.company || '',
      quote.client || null,
      quote.cnpj || null,
      quote.machine_model || null,
      quote.tech_spec || null,
      quote.principle || null,
      quote.representative || '',
      quote.supplier || '',
      quote.services || '',
      parseInt(quote.validity_days) || 15,
      quote.delivery_time || null,
      quote.notes || null,
      quote.status || 'Rascunho',
      quote.contact_email || null,
      quote.contact_phone || null,
      quote.seller_name || null,
      quote.equipment_image || null,
      quote.include_payment_conditions || false,
      quote.payment_intro || null,
      quote.payment_usd_conditions || null,
      quote.payment_brl_intro || null,
      quote.payment_brl_with_sat || null,
      quote.payment_brl_without_sat || null,
      quote.payment_additional_notes || null
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
          'INSERT INTO items (quote_id, spec_index, name, price, qty, currency, days) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            quoteId,
            i,
            item.name || '',
            parseFloat(item.price) || 0,
            parseInt(item.qty) || 1,
            item.currency || 'BRL',
            item.days ? parseInt(item.days) : null
          ]
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

export async function deleteQuote(quoteCode) {
  try {
    // Delete items first (due to foreign key constraints)
    await pool.execute('DELETE FROM items WHERE quote_id = (SELECT id FROM quotes WHERE quote_code = $1)', [quoteCode]);

    // Delete specs
    await pool.execute('DELETE FROM specs WHERE quote_id = (SELECT id FROM quotes WHERE quote_code = $1)', [quoteCode]);

    // Delete quote
    const [result] = await pool.execute('DELETE FROM quotes WHERE quote_code = $1', [quoteCode]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erro ao deletar cotação:', error);
    throw error;
  }
}