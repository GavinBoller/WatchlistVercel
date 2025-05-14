import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import * as schema from '@shared/schema';

config();

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export async function executeDirectSql(query: string, params: any[] = []) {
  try {
    const result = await sql(query, params);
    return result;
  } catch (error) {
    console.error('[DB] Error executing SQL query:', error);
    throw error;
  }
}