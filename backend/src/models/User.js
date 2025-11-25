import { getDB } from '../db.js';

export async function findUserByEmail(email) {
  const db = getDB();
  const [rows] = await db.execute(
    'SELECT id, email, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

export async function createUser({ email, passwordHash }) {
  const db = getDB();
  const [result] = await db.execute(
    'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, NOW())',
    [email, passwordHash]
  );
  const id = result.insertId;
  return { id, email, passwordHash };
}
