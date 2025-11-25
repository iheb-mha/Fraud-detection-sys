import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'fraud_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function connectDB() {
  const dbName = process.env.MYSQL_DB || 'fraud_app';

  try {
    await pool.query('SELECT 1');
  } catch (err) {
    if (err.code !== 'ER_BAD_DB_ERROR') {
      throw err;
    }

    const host = process.env.MYSQL_HOST || 'localhost';
    const port = Number(process.env.MYSQL_PORT || 3306);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';

    const setupConn = await mysql.createConnection({ host, port, user, password });
    await setupConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await setupConn.end();
  }

  await pool.query(
    `CREATE TABLE IF NOT EXISTS users (
       id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       email VARCHAR(255) NOT NULL UNIQUE,
       password_hash VARCHAR(255) NOT NULL,
       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     ) ENGINE=InnoDB`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS analyses (
       id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       user_id INT UNSIGNED NOT NULL,
       input_json JSON NOT NULL,
       result_json JSON NOT NULL,
       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT fk_analyses_user
         FOREIGN KEY (user_id) REFERENCES users(id)
         ON DELETE CASCADE
     ) ENGINE=InnoDB`
  );
}

export function getDB() {
  return pool;
}
