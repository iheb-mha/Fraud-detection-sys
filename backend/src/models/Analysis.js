import { getDB } from '../db.js';

export async function createAnalysis({ userId, input, result }) {
  const db = getDB();
  await db.execute(
    'INSERT INTO analyses (user_id, input_json, result_json, created_at) VALUES (?, ?, ?, NOW())',
    [userId, JSON.stringify(input), JSON.stringify(result)]
  );
}

export async function getAnalysesByUserId(userId) {
  const db = getDB();
  const [rows] = await db.execute(
    'SELECT id, user_id AS userId, input_json AS inputJson, result_json AS resultJson, created_at AS createdAt FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
    [userId]
  );
  return rows.map(r => ({
    _id: r.id,
    user: r.userId,
    input: JSON.parse(r.inputJson),
    result: JSON.parse(r.resultJson),
    createdAt: r.createdAt
  }));
}
