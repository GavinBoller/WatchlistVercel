import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

export const DATABASE_URL = process.env.DATABASE_URL || '';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function executeDirectSql(query: string) {
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('[DB] Error executing direct SQL:', error);
    throw error;
  }
}