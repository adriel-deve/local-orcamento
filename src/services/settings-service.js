import pool from '../db.js';

const isPostgres = !!process.env.DATABASE_URL;

// Helper to convert ? to $1, $2, etc for PostgreSQL
function convertPlaceholders(query) {
  if (!isPostgres) return query;

  let index = 1;
  return query.replace(/\?/g, () => `$${index++}`);
}

// Buscar todas as configurações
export async function getAllSettings() {
  const query = 'SELECT * FROM form_settings ORDER BY category, key';
  const [rows] = await pool.query(query);
  return rows || [];
}

// Buscar configurações por categoria
export async function getSettingsByCategory(category) {
  const query = convertPlaceholders('SELECT * FROM form_settings WHERE category = ? ORDER BY key');
  const [rows] = await pool.query(query, [category]);
  return rows || [];
}

// Buscar uma configuração específica
export async function getSetting(key) {
  const query = convertPlaceholders('SELECT * FROM form_settings WHERE key = ?');
  const [rows] = await pool.query(query, [key]);
  return rows[0] || null;
}

// Atualizar uma configuração
export async function updateSetting(key, value, userId) {
  const query = convertPlaceholders(`
    UPDATE form_settings
    SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE key = ?
  `);

  await pool.query(query, [value, userId, key]);
  return await getSetting(key);
}

// Atualizar múltiplas configurações de uma vez
export async function updateMultipleSettings(settings, userId) {
  const promises = Object.entries(settings).map(([key, value]) =>
    updateSetting(key, value, userId)
  );

  await Promise.all(promises);
  return true;
}

// Buscar configurações formatadas como objeto chave-valor
export async function getSettingsAsObject() {
  const settings = await getAllSettings();
  const result = {};

  settings.forEach(setting => {
    result[setting.key] = setting.value;
  });

  return result;
}
