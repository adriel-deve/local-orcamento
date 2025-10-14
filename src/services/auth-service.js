import bcrypt from 'bcrypt';
import pool from '../db.js';

const SALT_ROUNDS = 10;
const isPostgres = !!process.env.DATABASE_URL;

// Helper to convert ? to $1, $2, etc for PostgreSQL
function convertPlaceholders(query) {
  if (!isPostgres) return query;

  let index = 1;
  return query.replace(/\?/g, () => `$${index++}`);
}

export async function createUser({ username, password, fullName, email, role = 'user' }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const insertQuery = convertPlaceholders(`
    INSERT INTO users (username, password_hash, full_name, email, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  const [result] = await pool.query(insertQuery, [username, passwordHash, fullName, email, role]);

  // Get the created user
  const selectQuery = convertPlaceholders('SELECT id, username, full_name, email, role, created_at FROM users WHERE id = ?');
  const [rows] = await pool.query(selectQuery, [result.insertId || result.rows?.[0]?.id]);
  return rows[0];
}

export async function authenticateUser(username, password) {
  const query = convertPlaceholders('SELECT * FROM users WHERE username = ? AND active = TRUE');
  const [rows] = await pool.query(query, [username]);

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  // Don't return password hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getAllUsers() {
  const query = 'SELECT id, username, full_name, email, role, active, created_at FROM users ORDER BY created_at DESC';
  const [rows] = await pool.query(query);
  return rows;
}

export async function getUserById(id) {
  const query = convertPlaceholders('SELECT id, username, full_name, email, role, active, created_at FROM users WHERE id = ?');
  const [rows] = await pool.query(query, [id]);
  return rows[0];
}

export async function updateUser(id, { fullName, email, role, active }) {
  const updateQuery = convertPlaceholders(`
    UPDATE users
    SET full_name = ?, email = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  await pool.query(updateQuery, [fullName, email, role, active, id]);

  // Get the updated user
  const selectQuery = convertPlaceholders('SELECT id, username, full_name, email, role, active FROM users WHERE id = ?');
  const [rows] = await pool.query(selectQuery, [id]);
  return rows[0];
}

export async function deleteUser(id) {
  // Don't actually delete, just deactivate
  const query = convertPlaceholders('UPDATE users SET active = FALSE WHERE id = ?');
  await pool.query(query, [id]);
}

export async function changePassword(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const query = convertPlaceholders('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  await pool.query(query, [passwordHash, id]);
}
