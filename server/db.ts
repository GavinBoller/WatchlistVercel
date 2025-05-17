import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

config();

const neonSql = neon(process.env.DATABASE_URL!);
export const db = drizzle(neonSql, { schema });

export interface User {
  id: number;
  username: string;
  password: string;
  display_name: string;
  role: string;
  created_at: string;
}

export async function executeDirectSql(query: string, params: any[] = []): Promise<User[]> {
  try {
    // Replace $1, $2, etc. with parameter values
    let formattedQuery = query;
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      formattedQuery = formattedQuery.replace(placeholder, typeof param === 'string' ? `'${param}'` : param);
    });
    const result = await db.execute(sql.raw(formattedQuery));
    return (result.rows || []).map(row => ({
      id: Number(row.id),
      username: String(row.username),
      password: String(row.password),
      display_name: String(row.display_name),
      role: String(row.role),
      created_at: String(row.created_at),
    })) as User[];
  } catch (error) {
    console.error('[DB] Error executing SQL query:', error);
    throw error;
  }
}
