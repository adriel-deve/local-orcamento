import pool from '../db.js';

export async function initDatabase() {
  try {
    await pool.execute('SELECT 1');
    console.log('Database connection established');

    // Tentar criar colunas de status se não existirem (para PostgreSQL/Neon)
    try {
      const usePostgreSQL = process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';

      if (usePostgreSQL) {
        console.log('Checking database schema...');

        // Adicionar colunas se não existirem
        await pool.execute(`
          ALTER TABLE quotes
          ADD COLUMN IF NOT EXISTS business_status VARCHAR(20) DEFAULT 'ativa',
          ADD COLUMN IF NOT EXISTS purchase_order VARCHAR(128) DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS closed_by INTEGER DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS baixa_reason TEXT DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS baixa_at TIMESTAMP DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS baixa_by INTEGER DEFAULT NULL
        `).catch(err => {
          if (!err.message.includes('already exists')) {
            console.error('Error adding columns:', err.message);
          }
        });

        // Criar índices
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_business_status ON quotes(business_status)`).catch(() => {});
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_supplier ON quotes(supplier)`).catch(() => {});
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client)`).catch(() => {});

        console.log('✅ Database schema up to date');
      }
    } catch (migrationError) {
      console.log('⚠️  Migration skipped (might already be applied):', migrationError.message);
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function saveQuoteAndSpecs({ quote, specs }) {
  try {
    // Inserir or atualizar cotacao
    const insertQuoteQuery = `
      INSERT INTO quotes (quote_code, date, company, client, cnpj, machine_model, tech_spec, principle,
                         representative, supplier, services, validity_days, delivery_time, notes, status,
                         contact_email, contact_phone, seller_name, equipment_image, include_payment_conditions,
                         payment_intro, payment_usd_conditions, payment_brl_intro, payment_brl_with_sat,
                         payment_brl_without_sat, payment_additional_notes, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
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
        user_id = EXCLUDED.user_id,
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
      quote.payment_additional_notes || null,
      quote.user_id || null
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
    // Buscar cotacao
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
          qty: item.qty ? parseInt(item.qty) : 1,
          currency: item.currency ? String(item.currency).toUpperCase() : 'BRL',
          days: item.days ? parseInt(item.days) : null
        }))
      });
    }

    return { quote, specs };

  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }
}

export async function getAllQuotes(userId = null, userRole = null) {
  try {
    // Todos os usuários veem todas as cotações (sem filtro por role)
    const query = 'SELECT quote_code, company, client, supplier, date, status, business_status, purchase_order, created_at FROM quotes ORDER BY created_at DESC';
    const params = [];

    const [rows] = await pool.execute(query, params);
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
    const [, meta] = await pool.execute('DELETE FROM quotes WHERE quote_code = $1', [quoteCode]);

    const affected = meta?.affectedRows ?? meta?.rowCount ?? 0;
    return affected > 0;
  } catch (error) {
    console.error('Erro ao deletar cotacao:', error);
    throw error;
  }
}

// Atualizar status de negócio da cotação
export async function updateQuoteBusinessStatus(quoteCode, status, userId, data = {}) {
  try {
    const updates = ['business_status = $1'];
    const params = [status];
    let paramIndex = 2;

    // Adicionar purchase_order
    if (status === 'pedido_compra') {
      updates.push(`purchase_order = $${paramIndex++}`);
      params.push(data.purchaseOrder || null);
    } else {
      updates.push(`purchase_order = NULL`);
    }

    // Adicionar campos de finalizada
    if (status === 'finalizada') {
      updates.push(`closed_at = CURRENT_TIMESTAMP`);
      updates.push(`closed_by = $${paramIndex++}`);
      params.push(userId);
    } else {
      updates.push(`closed_at = NULL`);
      updates.push(`closed_by = NULL`);
    }

    // Adicionar campos de baixa
    if (status === 'baixa') {
      updates.push(`baixa_reason = $${paramIndex++}`);
      updates.push(`baixa_at = CURRENT_TIMESTAMP`);
      updates.push(`baixa_by = $${paramIndex++}`);
      params.push(data.reason || null, userId);
    } else {
      updates.push(`baixa_reason = NULL`);
      updates.push(`baixa_at = NULL`);
      updates.push(`baixa_by = NULL`);
    }

    params.push(quoteCode);
    const query = `UPDATE quotes SET ${updates.join(', ')} WHERE quote_code = $${paramIndex}`;

    console.log('[UPDATE STATUS] Query:', query);
    console.log('[UPDATE STATUS] Params:', params);

    const [, meta] = await pool.execute(query, params);
    const affected = meta?.affectedRows ?? meta?.rowCount ?? 0;

    console.log('[UPDATE STATUS] Affected rows:', affected);

    return affected > 0;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
}

// Estatísticas para o dashboard
export async function getDashboardStats(userId = null, userRole = null) {
  try {
    const startTime = Date.now();
    console.log('[getDashboardStats] Starting... userId:', userId, 'userRole:', userRole);
    const stats = {};

    // Filtro baseado em role
    const userFilter = userRole === 'admin' ? '' : ` WHERE user_id = $1`;
    const userParam = userRole === 'admin' ? [] : [userId];

    // Query única otimizada para pegar múltiplos counts de uma vez
    // Usando CASE em vez de FILTER para compatibilidade com MySQL
    // COALESCE garante que SUM retorne 0 em vez de NULL quando não há registros
    const [aggregatedRows] = await pool.execute(`
      SELECT
        COUNT(*) as total_quotes,
        COALESCE(SUM(CASE WHEN status = 'Concluída' THEN 1 ELSE 0 END), 0) as completed_quotes,
        COALESCE(SUM(CASE WHEN status = 'Rascunho' THEN 1 ELSE 0 END), 0) as draft_quotes,
        COALESCE(SUM(CASE WHEN status = 'Concluída' AND COALESCE(business_status, 'ativa') = 'ativa' THEN 1 ELSE 0 END), 0) as ativa_count,
        COALESCE(SUM(CASE WHEN status = 'Concluída' AND business_status = 'pedido_compra' THEN 1 ELSE 0 END), 0) as pedido_compra_count,
        COALESCE(SUM(CASE WHEN status = 'Concluída' AND business_status = 'finalizada' THEN 1 ELSE 0 END), 0) as finalizada_count,
        COALESCE(SUM(CASE WHEN status = 'Concluída' AND business_status = 'baixa' THEN 1 ELSE 0 END), 0) as baixa_count
      FROM quotes${userFilter}
    `, userParam);

    console.log('[getDashboardStats] Raw aggregated data:', aggregatedRows[0]);

    const agg = aggregatedRows[0];
    console.log('[getDashboardStats] Parsing aggregated data - types:', {
      total_quotes: typeof agg.total_quotes,
      completed_quotes: typeof agg.completed_quotes,
      draft_quotes: typeof agg.draft_quotes
    });

    stats.totalQuotes = parseInt(agg.total_quotes) || 0;
    stats.totalDrafts = parseInt(agg.draft_quotes) || 0;
    stats.byStatus = {
      'Concluída': parseInt(agg.completed_quotes) || 0,
      'Rascunho': parseInt(agg.draft_quotes) || 0
    };
    stats.byBusinessStatus = {
      'ativa': parseInt(agg.ativa_count) || 0,
      'pedido_compra': parseInt(agg.pedido_compra_count) || 0,
      'finalizada': parseInt(agg.finalizada_count) || 0,
      'baixa': parseInt(agg.baixa_count) || 0
    };

    console.log('[getDashboardStats] Parsed stats:', JSON.stringify(stats, null, 2));

    // Total de usuários (apenas admin) - query simples
    if (userRole === 'admin') {
      const [userRows] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE active = true');
      stats.totalUsers = parseInt(userRows[0]?.count) || 0;
    }

    // Queries paralelas para fornecedores, clientes e usuários
    const parallelQueries = [];

    // Cotações por fornecedor
    parallelQueries.push(
      pool.execute(`
        SELECT supplier, COUNT(*) as count
        FROM quotes
        WHERE supplier IS NOT NULL AND supplier != ''${userRole === 'admin' ? '' : ' AND user_id = $1'}
        GROUP BY supplier
        ORDER BY count DESC
        LIMIT 10
      `, userParam)
    );

    // Cotações por cliente
    parallelQueries.push(
      pool.execute(`
        SELECT client, COUNT(*) as count
        FROM quotes
        WHERE client IS NOT NULL AND client != ''${userRole === 'admin' ? '' : ' AND user_id = $1'}
        GROUP BY client
        ORDER BY count DESC
        LIMIT 10
      `, userParam)
    );

    // Cotações por usuário (apenas admin)
    if (userRole === 'admin') {
      parallelQueries.push(
        pool.execute(`
          SELECT u.username, u.full_name, COUNT(q.id) as count
          FROM users u
          LEFT JOIN quotes q ON u.id = q.user_id
          WHERE u.active = true
          GROUP BY u.id, u.username, u.full_name
          ORDER BY count DESC
        `)
      );
    }

    // Executar todas as queries em paralelo
    console.log('[getDashboardStats] Executing parallel queries...');
    const results = await Promise.all(parallelQueries);
    console.log('[getDashboardStats] Parallel queries completed');

    // Processar resultados
    const [supplierRows] = results[0];
    console.log('[getDashboardStats] Supplier rows count:', supplierRows?.length || 0);
    stats.bySupplier = supplierRows.map(row => ({
      supplier: row.supplier,
      count: parseInt(row.count) || 0
    }));

    const [clientRows] = results[1];
    console.log('[getDashboardStats] Client rows count:', clientRows?.length || 0);
    stats.byClient = clientRows.map(row => ({
      client: row.client,
      count: parseInt(row.count) || 0
    }));

    if (userRole === 'admin' && results[2]) {
      const [userQuoteRows] = results[2];
      console.log('[getDashboardStats] User rows count:', userQuoteRows?.length || 0);
      stats.byUser = userQuoteRows.map(row => ({
        username: row.username,
        full_name: row.full_name,
        count: parseInt(row.count) || 0
      }));
    }

    const elapsed = Date.now() - startTime;
    console.log(`[getDashboardStats] ✅ Completed in ${elapsed}ms`);
    console.log('[getDashboardStats] Final stats object:', JSON.stringify(stats, null, 2));
    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw error;
  }
}


