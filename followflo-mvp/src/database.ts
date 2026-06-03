import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// DATABASE_URL形式（Supabase/Railway提供）を優先、個別env varをフォールバック
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost')
          ? false
          : { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'followflo_user',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'followflo_mvp',
      }
);

export async function initDatabase() {
  try {
    const schema = fs.readFileSync(
      path.join(__dirname, '../config/schema.sql'),
      'utf-8'
    );
    await pool.query(schema);
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function getClient() {
  return pool.connect();
}

export default pool;
