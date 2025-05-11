import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

let db;

export async function getDb() {
  if (!db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function executeDirectSql<T>(
  sql: string,
  params: any[] = [],
  errorMessage = 'SQL execution failed'
): Promise<{ rows: T[], rowCount: number | null }> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  try {
    const client = await pool.connect();
    try {
      const result = await client.query<T>(sql, params);
      return { rows: result.rows, rowCount: result.rowCount };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  } finally {
    await pool.end();
  }
}

export async function ensureDatabaseReady(): Promise<boolean> {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    const client = await pool.connect();
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error("Database connection check failed:", error);
    return false;
  }
}