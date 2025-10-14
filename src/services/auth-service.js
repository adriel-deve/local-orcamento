import bcrypt from 'bcrypt';
import pool from '../db.js';

const SALT_ROUNDS = 10;

export async function createUser({ username, password, fullName, email, role = 'user' }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const query = `
    INSERT INTO users (username, password_hash, full_name, email, role)
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [username, passwordHash, fullName, email, role]);

  // Get the created user
  const [rows] = await pool.query('SELECT id, username, full_name, email, role, created_at FROM users WHERE id = ?', [result.insertId]);
  return rows[0];
}

export async function authenticateUser(username, password) {
  const query = 'SELECT * FROM users WHERE username = ? AND active = TRUE';
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
  const query = 'SELECT id, username, full_name, email, role, active, created_at FROM users WHERE id = ?';
  const [rows] = await pool.query(query, [id]);
  return rows[0];
}

export async function updateUser(id, { fullName, email, role, active }) {
  const query = `
    UPDATE users
    SET full_name = ?, email = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await pool.query(query, [fullName, email, role, active, id]);

  // Get the updated user
  const [rows] = await pool.query('SELECT id, username, full_name, email, role, active FROM users WHERE id = ?', [id]);
  return rows[0];
}

export async function deleteUser(id) {
  // Don't actually delete, just deactivate
  const query = 'UPDATE users SET active = FALSE WHERE id = ?';
  await pool.query(query, [id]);
}

export async function changePassword(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const query = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  await pool.query(query, [passwordHash, id]);
}
